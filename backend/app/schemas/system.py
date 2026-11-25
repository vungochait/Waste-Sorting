from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class RuntimeSettings(BaseModel):
    """Các tham số inference chỉnh được lúc chạy (lưu ở backend/runtime_settings.json)."""

    yolo_conf: float = Field(0.35, ge=0.01, le=0.99)
    yolo_iou: float = Field(0.45, ge=0.05, le=0.95)
    yolo_imgsz: int = Field(640, ge=320, le=1920)
    yolo_max_det: int = Field(50, ge=1, le=300)
    sam_enabled: bool = True


class RuntimeSettingsUpdate(BaseModel):
    yolo_conf: Optional[float] = Field(None, ge=0.01, le=0.99)
    yolo_iou: Optional[float] = Field(None, ge=0.05, le=0.95)
    yolo_imgsz: Optional[int] = Field(None, ge=320, le=1920)
    yolo_max_det: Optional[int] = Field(None, ge=1, le=300)
    sam_enabled: Optional[bool] = None
