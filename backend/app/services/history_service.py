"""Lưu, truy vấn và xóa lịch sử nhận diện; cập nhật bảng Statistics."""
from __future__ import annotations

from collections import Counter
from datetime import date, datetime
from typing import Any, Optional

import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import DetectionHistory, Statistics
from app.utils.errors import NotFoundError
from app.utils.image import delete_image, image_url, save_image


def _adjust_stats(db: Session, day: date, counts: Counter, sign: int) -> None:
    for category, n in counts.items():
        row = db.execute(
            select(Statistics).where(Statistics.category == category, Statistics.detection_date == day)
        ).scalar_one_or_none()
        if row is None:
            if sign < 0:
                continue
            row = Statistics(category=category, quantity=0, detection_date=day)
            db.add(row)
        row.quantity = max(0, (row.quantity or 0) + sign * n)


def save_analysis(*, image: np.ndarray, filename: Optional[str], objects: list[dict[str, Any]], source: str,
                  category: Optional[str], timings: dict[str, float], model_info: dict[str, Any]) -> dict[str, Any]:
    rel_path = save_image(image)
    h, w = image.shape[:2]
    today = datetime.now().date()
    confs = [o["confidence"] for o in objects]
    with SessionLocal() as db:
        record = DetectionHistory(
            image_path=rel_path,
            original_filename=(filename or None),
            width=w,
            height=h,
            detected_objects=objects,
            object_count=len(objects),
            category=category,
            confidence=round(sum(confs) / len(confs), 4) if confs else None,
            source=source,
            timings=timings,
            model_info=model_info,
            detection_date=today,
        )
        db.add(record)
        _adjust_stats(db, today, Counter(o["category"] for o in objects), +1)
        db.commit()
        return {"id": record.id, "image_url": image_url(rel_path)}


def to_item(r: DetectionHistory) -> dict[str, Any]:
    return {
        "id": r.id,
        "image_url": image_url(r.image_path),
        "original_filename": r.original_filename,
        "width": r.width,
        "height": r.height,
        "detected_objects": r.detected_objects or [],
        "object_count": r.object_count,
        "category": r.category,
        "confidence": r.confidence,
        "source": r.source,
        "timings": r.timings or {},
        "model_info": r.model_info or {},
        "created_at": r.created_at,
    }


def list_history(db: Session, *, search: Optional[str], category: Optional[str], date_from: Optional[date],
                 date_to: Optional[date], page: int, page_size: int) -> dict[str, Any]:
    q = select(DetectionHistory)
    if date_from:
        q = q.where(DetectionHistory.detection_date >= date_from)
    if date_to:
        q = q.where(DetectionHistory.detection_date <= date_to)
    rows = db.execute(q.order_by(DetectionHistory.created_at.desc(), DetectionHistory.id.desc())).scalars().all()

    # Lọc theo nhóm / từ khóa trên danh sách vật thể (JSON) – đủ nhanh cho quy mô cá nhân.
    def match(r: DetectionHistory) -> bool:
        objs = r.detected_objects or []
        if category and not any(o.get("category") == category for o in objs):
            return False
        if search:
            s = search.strip().lower()
            hay = [r.original_filename or ""] + [str(o.get("name", "")) for o in objs] + [str(o.get("label", "")) for o in objs]
            if not any(s in h.lower() for h in hay):
                return False
        return True

    filtered = [r for r in rows if match(r)]
    total = len(filtered)
    start = (page - 1) * page_size
    return {"items": [to_item(r) for r in filtered[start:start + page_size]], "total": total,
            "page": page, "page_size": page_size}


def get_history(db: Session, history_id: int) -> DetectionHistory:
    r = db.get(DetectionHistory, history_id)
    if r is None:
        raise NotFoundError(f"Không tìm thấy bản ghi lịch sử #{history_id}.")
    return r


def delete_history(db: Session, history_id: int) -> None:
    r = get_history(db, history_id)
    counts = Counter(o.get("category", "other") for o in (r.detected_objects or []))
    _adjust_stats(db, r.detection_date, counts, -1)
    path = r.image_path
    db.delete(r)
    db.commit()
    delete_image(path)


def clear_history(db: Session) -> int:
    rows = db.execute(select(DetectionHistory)).scalars().all()
    paths = [r.image_path for r in rows]
    n = len(rows)
    for r in rows:
        db.delete(r)
    db.query(Statistics).delete()
    db.commit()
    for p in paths:
        delete_image(p)
    return n
