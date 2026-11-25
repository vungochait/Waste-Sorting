"""Segment Anything: nhận bounding box từ YOLO làm prompt, trả về mask cho từng box.

Hai backend:
  * ultralytics – SAM, SAM 2, SAM 2.1 qua thư viện Ultralytics (mặc định, dễ cài).
  * sam2        – thư viện gốc facebookresearch/sam2 (SAM2ImagePredictor).
SAM chỉ phân đoạn; việc phân loại do YOLO đảm nhận.
"""
from __future__ import annotations

import logging
import threading
from pathlib import Path
from typing import Any, Optional

import cv2
import numpy as np

log = logging.getLogger("ecoai.sam")


class SamSegmenter:
    def __init__(self, weights: Path, backend: str = "ultralytics", device: str = "cpu",
                 sam2_config: Optional[str] = None) -> None:
        self.weights = Path(weights)
        self.backend = (backend or "ultralytics").lower()
        self.device = device
        self.sam2_config = sam2_config
        self.model: Any = None
        self.predictor: Any = None
        self._lock = threading.Lock()

    @property
    def loaded(self) -> bool:
        return self.model is not None or self.predictor is not None

    def load(self) -> None:
        if not self.weights.is_file():
            raise FileNotFoundError(str(self.weights))
        if self.backend == "sam2":
            from sam2.build_sam import build_sam2  # type: ignore
            from sam2.sam2_image_predictor import SAM2ImagePredictor  # type: ignore

            if not self.sam2_config:
                raise ValueError("SAM_BACKEND=sam2 cần SAM2_CONFIG (vd: configs/sam2.1/sam2.1_hiera_b+.yaml)")
            sam_model = build_sam2(self.sam2_config, str(self.weights), device=self.device)
            self.predictor = SAM2ImagePredictor(sam_model)
        else:
            from ultralytics import SAM

            self.model = SAM(str(self.weights))
            try:
                dummy = np.zeros((256, 256, 3), dtype=np.uint8)
                self.model.predict(dummy, bboxes=[[32, 32, 200, 200]], device=self.device, verbose=False)
            except Exception as exc:  # pragma: no cover
                log.warning("SAM warm-up lỗi (bỏ qua): %s", exc)
        log.info("SAM đã nạp: %s (backend=%s) trên %s", self.weights.name, self.backend, self.device)

    def segment(self, image_bgr: np.ndarray, boxes: list[list[float]]) -> list[tuple[np.ndarray, Optional[float]]]:
        """Trả về [(mask bool HxW, score|None)] theo đúng thứ tự `boxes`."""
        if not boxes:
            return []
        if not self.loaded:
            raise RuntimeError("SAM chưa được nạp")
        h, w = image_bgr.shape[:2]
        with self._lock:
            if self.backend == "sam2":
                return self._segment_sam2(image_bgr, boxes, h, w)
            return self._segment_ultralytics(image_bgr, boxes, h, w)

    def _segment_ultralytics(self, image_bgr: np.ndarray, boxes: list[list[float]], h: int, w: int):
        results = self.model.predict(image_bgr, bboxes=[list(map(float, b)) for b in boxes],
                                     device=self.device, verbose=False)
        out: list[tuple[np.ndarray, Optional[float]]] = []
        if not results or getattr(results[0], "masks", None) is None:
            return [(np.zeros((h, w), dtype=bool), None) for _ in boxes]
        res = results[0]
        data = res.masks.data.cpu().numpy()
        scores = None
        if getattr(res, "boxes", None) is not None and getattr(res.boxes, "conf", None) is not None:
            try:
                scores = res.boxes.conf.cpu().numpy().tolist()
            except Exception:
                scores = None
        for i in range(len(boxes)):
            if i < len(data):
                m = data[i]
                if m.shape != (h, w):
                    m = cv2.resize(m.astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST)
                score = float(scores[i]) if scores and i < len(scores) else None
                out.append((m > 0.5, score))
            else:
                out.append((np.zeros((h, w), dtype=bool), None))
        return out

    def _segment_sam2(self, image_bgr: np.ndarray, boxes: list[list[float]], h: int, w: int):
        import torch

        rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        with torch.inference_mode():
            self.predictor.set_image(rgb)
            masks, scores, _ = self.predictor.predict(
                point_coords=None,
                point_labels=None,
                box=np.asarray(boxes, dtype=np.float32),
                multimask_output=False,
            )
        masks = np.asarray(masks)
        scores = np.asarray(scores)
        if masks.ndim == 4:  # (N, 1, H, W)
            masks = masks[:, 0]
            scores = scores.reshape(len(boxes), -1)[:, 0]
        elif masks.ndim == 3 and len(boxes) == 1:  # (1, H, W)
            scores = scores.reshape(-1)[:1]
        out = []
        for i in range(len(boxes)):
            m = masks[i]
            if m.shape != (h, w):
                m = cv2.resize(m.astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST)
            out.append((m > 0.5, float(scores[i]) if i < len(scores) else None))
        return out
