from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any, Optional

from sqlalchemy import JSON, Date, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class DetectionHistory(Base):
    __tablename__ = "detection_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    image_path: Mapped[str] = mapped_column(String(512))
    original_filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    width: Mapped[int] = mapped_column(Integer, default=0)
    height: Mapped[int] = mapped_column(Integer, default=0)
    # Danh sách vật thể: nhãn, nhóm, độ tin cậy, bbox, polygon mask, diện tích...
    detected_objects: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    object_count: Mapped[int] = mapped_column(Integer, default=0)
    # Nhóm rác chiếm ưu thế trong ảnh (None nếu không có vật thể)
    category: Mapped[Optional[str]] = mapped_column(String(32), nullable=True, index=True)
    # Độ tin cậy trung bình của các vật thể
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    source: Mapped[str] = mapped_column(String(16), default="upload")
    timings: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    model_info: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    detection_date: Mapped[date] = mapped_column(Date, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)
