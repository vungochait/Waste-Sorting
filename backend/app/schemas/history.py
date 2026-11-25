from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, field_serializer


class HistoryItem(BaseModel):
    id: int
    image_url: Optional[str]
    original_filename: Optional[str]
    width: int
    height: int
    detected_objects: list[dict[str, Any]]
    object_count: int
    category: Optional[str]
    confidence: Optional[float]
    source: str
    timings: dict[str, Any]
    model_info: dict[str, Any]
    created_at: datetime

    @field_serializer("created_at")
    def _ser_created(self, value: datetime) -> str:
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()


class HistoryList(BaseModel):
    items: list[HistoryItem]
    total: int
    page: int
    page_size: int
