"""Pipeline YOLO + SAM.

1. YOLO phát hiện vật thể -> bounding box, nhãn, độ tin cậy.
2. Nhãn được ánh xạ sang 6 nhóm rác (class_map.yaml).
3. Bounding box được gửi cho SAM làm prompt -> segmentation mask cho từng vật thể.
4. Mask -> polygon + diện tích tương đối.
Không có bất kỳ kết quả giả lập nào: nếu model chưa sẵn sàng, hàm sẽ ném ModelUnavailableError.
"""
from __future__ import annotations

import logging
import time
from collections import Counter
from typing import Any, Iterator, Optional

import numpy as np

from app.services import class_map, image_cache
from app.services.model_manager import manager
from app.services.runtime_settings import get_runtime
from app.utils.errors import EcoAIError, ModelUnavailableError
from app.utils.masks import ensure_mask_shape, mask_stats, mask_to_polygons

log = logging.getLogger("ecoai.pipeline")


def _ms(start: float) -> float:
    return round((time.perf_counter() - start) * 1000, 1)


def detect_objects(image: np.ndarray) -> tuple[list[dict[str, Any]], float]:
    yolo = manager.require_yolo()
    rt = get_runtime()
    t0 = time.perf_counter()
    detections = yolo.detect(image, conf=rt.yolo_conf, iou=rt.yolo_iou, imgsz=rt.yolo_imgsz, max_det=rt.yolo_max_det)
    elapsed = _ms(t0)
    objects: list[dict[str, Any]] = []
    for i, d in enumerate(detections):
        guide = class_map.classify(d.label)
        objects.append({
            "id": i,
            "label": d.label,
            "name": guide["name"],
            "category": guide["category"],
            "confidence": round(d.confidence, 4),
            "bbox": [round(v, 1) for v in d.bbox],
            "area_ratio": None,
            "mask_area_px": None,
            "polygons": None,
            "mask_score": None,
            "instructions": guide["instructions"],
            "recommendation": guide["recommendation"],
            "bin": guide["bin"],
        })
    return objects, elapsed


def segment_boxes(image: np.ndarray, boxes: list[list[float]]) -> tuple[list[dict[str, Any]], float]:
    sam = manager.require_sam()
    h, w = image.shape[:2]
    clean: list[list[float]] = []
    for b in boxes:
        if len(b) != 4:
            raise EcoAIError("Mỗi bounding box phải có dạng [x1, y1, x2, y2].", code="INVALID_BOX")
        x1, y1, x2, y2 = (float(v) for v in b)
        x1, x2 = sorted((max(0.0, min(w, x1)), max(0.0, min(w, x2))))
        y1, y2 = sorted((max(0.0, min(h, y1)), max(0.0, min(h, y2))))
        if x2 - x1 < 2 or y2 - y1 < 2:
            raise EcoAIError("Bounding box quá nhỏ hoặc nằm ngoài ảnh.", code="INVALID_BOX")
        clean.append([x1, y1, x2, y2])
    t0 = time.perf_counter()
    raw = sam.segment(image, clean)
    elapsed = _ms(t0)
    results: list[dict[str, Any]] = []
    for i, (mask, score) in enumerate(raw):
        mask = ensure_mask_shape(mask, h, w)
        area_px, ratio = mask_stats(mask)
        results.append({
            "index": i,
            "bbox": [round(v, 1) for v in clean[i]],
            "polygons": [[[round(x, 1), round(y, 1)] for x, y in poly] for poly in mask_to_polygons(mask)],
            "area_ratio": round(ratio, 5),
            "mask_area_px": area_px,
            "score": round(score, 4) if score is not None else None,
        })
    return results, elapsed


def summarize(objects: list[dict[str, Any]]) -> list[dict[str, Any]]:
    counts = Counter(o["category"] for o in objects)
    return [{"category": c, "count": n} for c, n in counts.most_common()]


def dominant_category(objects: list[dict[str, Any]]) -> Optional[str]:
    if not objects:
        return None
    score: dict[str, tuple[int, float]] = {}
    for o in objects:
        n, s = score.get(o["category"], (0, 0.0))
        score[o["category"]] = (n + 1, s + o["confidence"])
    return max(score.items(), key=lambda kv: kv[1])[0]


def analyze_events(image: np.ndarray, *, filename: Optional[str], source: str = "upload",
                   save: bool = True) -> Iterator[dict[str, Any]]:
    """Chạy toàn bộ pipeline, phát sự kiện theo từng giai đoạn (dùng cho NDJSON streaming)."""
    from app.services import history_service

    timings: dict[str, float] = {}
    h, w = image.shape[:2]
    image_id = image_cache.put(image)
    yield {"type": "stage", "stage": "upload", "status": "done", "width": w, "height": h, "image_id": image_id}

    try:
        yield {"type": "stage", "stage": "detect", "status": "running"}
        objects, timings["detect_ms"] = detect_objects(image)
        yield {"type": "stage", "stage": "detect", "status": "done", "count": len(objects), "ms": timings["detect_ms"]}
        yield {"type": "detections", "objects": objects}

        segmented = False
        rt = get_runtime()
        if objects and rt.sam_enabled:
            yield {"type": "stage", "stage": "segment", "status": "running"}
            masks, timings["segment_ms"] = segment_boxes(image, [o["bbox"] for o in objects])
            for obj, m in zip(objects, masks):
                obj["polygons"] = m["polygons"]
                obj["area_ratio"] = m["area_ratio"]
                obj["mask_area_px"] = m["mask_area_px"]
                obj["mask_score"] = m["score"]
            segmented = True
            yield {"type": "stage", "stage": "segment", "status": "done", "ms": timings["segment_ms"]}
        else:
            reason = "Không có vật thể để phân đoạn." if not objects else "SAM đang tắt trong Cài đặt."
            yield {"type": "stage", "stage": "segment", "status": "skipped", "reason": reason}

        yield {"type": "stage", "stage": "classify", "status": "done", "summary": summarize(objects)}

        history_id: Optional[int] = None
        image_url: Optional[str] = None
        if save:
            yield {"type": "stage", "stage": "save", "status": "running"}
            t0 = time.perf_counter()
            record = history_service.save_analysis(
                image=image, filename=filename, objects=objects, source=source,
                category=dominant_category(objects), timings=timings, model_info=manager.model_info())
            timings["save_ms"] = _ms(t0)
            history_id, image_url = record["id"], record["image_url"]
            yield {"type": "stage", "stage": "save", "status": "done", "history_id": history_id}

        yield {"type": "result", "data": {
            "history_id": history_id,
            "image_id": image_id,
            "image_url": image_url,
            "width": w,
            "height": h,
            "objects": objects,
            "summary": summarize(objects),
            "segmented": segmented,
            "timings": timings,
            "model": manager.model_info(),
            "message": None if objects else
            "Không phát hiện vật thể rác nào ở ngưỡng tin cậy hiện tại. Thử chụp gần hơn, đủ sáng, "
            "hoặc giảm ngưỡng confidence trong Cài đặt.",
        }}
    except (EcoAIError, ModelUnavailableError) as exc:
        yield {"type": "error", "status_code": exc.status_code, "error": exc.to_dict()}
    except Exception as exc:  # pragma: no cover
        log.exception("Pipeline lỗi")
        yield {"type": "error", "status_code": 500,
               "error": {"code": "INFERENCE_FAILED", "message": f"Lỗi khi chạy AI: {exc}"}}


def analyze(image: np.ndarray, *, filename: Optional[str], source: str = "upload", save: bool = True) -> dict[str, Any]:
    result: Optional[dict[str, Any]] = None
    for event in analyze_events(image, filename=filename, source=source, save=save):
        if event["type"] == "error":
            err = event["error"]
            raise EcoAIError(err.get("message", "Lỗi"), code=err.get("code"), status_code=event["status_code"],
                             extra={k: v for k, v in err.items() if k not in ("code", "message")})
        if event["type"] == "result":
            result = event["data"]
    assert result is not None
    return result
