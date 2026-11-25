from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field

Polygon = list[list[float]]


class DetectedObject(BaseModel):
    id: int
    label: str = Field(description="Tên lớp gốc do YOLO trả về")
    name: str = Field(description="Tên hiển thị tiếng Việt")
    category: str
    confidence: float
    bbox: list[float] = Field(description="[x1, y1, x2, y2] theo pixel ảnh")
    area_ratio: Optional[float] = Field(None, description="Diện tích mask / diện tích ảnh (0–1)")
    mask_area_px: Optional[int] = None
    polygons: Optional[list[Polygon]] = None
    mask_score: Optional[float] = None
    instructions: list[str] = []
    recommendation: str = ""
    bin: str = ""


class DetectResponse(BaseModel):
    image_id: str
    width: int
    height: int
    objects: list[DetectedObject]
    timings: dict[str, float]
    model: dict[str, Any]


class MaskResult(BaseModel):
    index: int
    bbox: list[float]
    polygons: list[Polygon]
    area_ratio: float
    mask_area_px: int
    score: Optional[float] = None


class SegmentResponse(BaseModel):
    image_id: str
    width: int
    height: int
    masks: list[MaskResult]
    timings: dict[str, float]
    model: dict[str, Any]


class CategorySummary(BaseModel):
    category: str
    count: int


class AnalyzeResponse(BaseModel):
    history_id: Optional[int] = None
    image_id: str
    image_url: Optional[str] = None
    width: int
    height: int
    objects: list[DetectedObject]
    summary: list[CategorySummary]
    segmented: bool
    timings: dict[str, float]
    model: dict[str, Any]
    message: Optional[str] = None
