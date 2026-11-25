"""YOLO object detection (Ultralytics YOLOv8 / YOLO11)."""
from __future__ import annotations

import logging
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

import numpy as np

log = logging.getLogger("ecoai.yolo")


@dataclass
class Detection:
    label: str
    class_id: int
    confidence: float
    bbox: list[float]  # x1, y1, x2, y2 (pixel)


class YoloDetector:
    def __init__(self, weights: Path, device: str = "cpu", half: bool = False) -> None:
        self.weights = Path(weights)
        self.device = device
        self.half = half and device.startswith("cuda")
        self.model: Any = None
        self.names: dict[int, str] = {}
        self.task: Optional[str] = None
        self._lock = threading.Lock()

    @property
    def loaded(self) -> bool:
        return self.model is not None

    def load(self) -> None:
        """Nạp weights. Không bao giờ tự tải model từ Internet: file phải tồn tại."""
        if not self.weights.is_file():
            raise FileNotFoundError(str(self.weights))
        from ultralytics import YOLO

        model = YOLO(str(self.weights))
        self.task = getattr(model, "task", None)
        if self.task not in (None, "detect", "segment", "obb"):
            raise ValueError(f"Weights YOLO có task='{self.task}', cần model detect.")
        self.names = {int(k): str(v) for k, v in dict(model.names).items()}
        self.model = model
        # Warm-up để lần gọi đầu tiên không bị chậm.
        try:
            dummy = np.zeros((320, 320, 3), dtype=np.uint8)
            model.predict(dummy, device=self.device, half=self.half, imgsz=320, verbose=False)
        except Exception as exc:  # pragma: no cover
            log.warning("YOLO warm-up lỗi (bỏ qua): %s", exc)
        log.info("YOLO đã nạp: %s (%d lớp) trên %s", self.weights.name, len(self.names), self.device)

    def detect(self, image_bgr: np.ndarray, conf: float, iou: float, imgsz: int, max_det: int) -> list[Detection]:
        if self.model is None:
            raise RuntimeError("YOLO chưa được nạp")
        with self._lock:
            results = self.model.predict(
                image_bgr,
                conf=conf,
                iou=iou,
                imgsz=imgsz,
                max_det=max_det,
                device=self.device,
                half=self.half,
                verbose=False,
            )
        if not results:
            return []
        res = results[0]
        boxes = getattr(res, "boxes", None)
        if boxes is None or len(boxes) == 0:
            return []
        xyxy = boxes.xyxy.cpu().numpy()
        confs = boxes.conf.cpu().numpy()
        classes = boxes.cls.cpu().numpy().astype(int)
        h, w = image_bgr.shape[:2]
        detections: list[Detection] = []
        for (x1, y1, x2, y2), c, k in zip(xyxy, confs, classes):
            detections.append(Detection(
                label=self.names.get(int(k), str(k)),
                class_id=int(k),
                confidence=float(c),
                bbox=[
                    float(max(0, min(w, x1))), float(max(0, min(h, y1))),
                    float(max(0, min(w, x2))), float(max(0, min(h, y2))),
                ],
            ))
        detections.sort(key=lambda d: d.confidence, reverse=True)
        return detections
