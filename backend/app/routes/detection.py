"""POST /api/detect, POST /api/segment, POST /api/analyze."""
from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, File, Form, Query, UploadFile
from fastapi.responses import StreamingResponse

from app.config import get_settings
from app.schemas import AnalyzeResponse, DetectResponse, SegmentResponse
from app.services import image_cache, pipeline
from app.services.model_manager import manager
from app.utils.errors import EcoAIError, InvalidImageError
from app.utils.image import decode_image, validate_upload

router = APIRouter(prefix="/api", tags=["AI"])


def _read_upload(file: UploadFile):
    limit = get_settings().max_upload_bytes
    data = file.file.read(limit + 1)
    validate_upload(file.filename, file.content_type, data)
    return decode_image(data)


@router.post("/detect", response_model=DetectResponse, summary="YOLO: phát hiện vật thể rác")
def detect(file: UploadFile = File(..., description="Ảnh JPG/JPEG/PNG/WEBP")):
    manager.require_yolo()
    image = _read_upload(file)
    objects, detect_ms = pipeline.detect_objects(image)
    h, w = image.shape[:2]
    return {
        "image_id": image_cache.put(image),
        "width": w,
        "height": h,
        "objects": objects,
        "timings": {"detect_ms": detect_ms},
        "model": manager.model_info(),
    }


@router.post("/segment", response_model=SegmentResponse, summary="SAM: phân đoạn theo bounding box")
def segment(
    boxes: str = Form(..., description='JSON: [[x1, y1, x2, y2], ...] theo pixel ảnh'),
    image_id: Optional[str] = Form(None, description="image_id trả về từ /api/detect"),
    file: Optional[UploadFile] = File(None, description="Hoặc gửi lại ảnh"),
):
    manager.require_sam()
    try:
        parsed = json.loads(boxes)
    except json.JSONDecodeError as exc:
        raise EcoAIError("Trường 'boxes' không phải JSON hợp lệ.", code="INVALID_BOX") from exc
    if not isinstance(parsed, list) or not parsed:
        raise EcoAIError("Cần ít nhất một bounding box.", code="INVALID_BOX")
    if parsed and isinstance(parsed[0], (int, float)):
        parsed = [parsed]

    if file is not None:
        image = _read_upload(file)
        image_id = image_cache.put(image)
    elif image_id:
        image = image_cache.get(image_id)
        if image is None:
            raise InvalidImageError("image_id đã hết hạn trong bộ nhớ đệm. Hãy gửi lại ảnh.", code="IMAGE_EXPIRED")
    else:
        raise InvalidImageError("Cần gửi 'file' hoặc 'image_id'.")

    masks, segment_ms = pipeline.segment_boxes(image, parsed)
    h, w = image.shape[:2]
    return {"image_id": image_id, "width": w, "height": h, "masks": masks,
            "timings": {"segment_ms": segment_ms}, "model": manager.model_info()}


@router.post("/analyze", response_model=AnalyzeResponse, summary="Pipeline đầy đủ YOLO + SAM + phân loại")
def analyze(
    file: UploadFile = File(...),
    save: bool = Form(True, description="Lưu vào lịch sử"),
    source: str = Form("upload", description="upload | camera"),
    stream: bool = Query(False, description="true: trả về NDJSON theo từng giai đoạn"),
):
    manager.require_yolo()
    image = _read_upload(file)
    save = save and get_settings().save_history
    source = source if source in ("upload", "camera") else "upload"

    if stream:
        events = pipeline.analyze_events(image, filename=file.filename, source=source, save=save)
        body = (json.dumps(e, ensure_ascii=False) + "\n" for e in events)
        return StreamingResponse(body, media_type="application/x-ndjson",
                                 headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
    return pipeline.analyze(image, filename=file.filename, source=source, save=save)
