"""Tổng hợp số liệu cho Dashboard từ bảng Statistics và DetectionHistory."""
from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import DetectionHistory, Statistics
from app.services.categories import CATEGORIES, CATEGORY_IDS


def get_statistics(db: Session, days: int = 14) -> dict[str, Any]:
    """days = 0 -> toàn bộ thời gian (biểu đồ theo ngày vẫn giới hạn 90 ngày gần nhất)."""
    today = datetime.now().date()
    start = today - timedelta(days=days - 1) if days > 0 else None

    sq = select(Statistics)
    hq = select(DetectionHistory)
    if start:
        sq = sq.where(Statistics.detection_date >= start)
        hq = hq.where(DetectionHistory.detection_date >= start)
    stats_rows = db.execute(sq).scalars().all()
    history_rows = db.execute(hq).scalars().all()

    by_cat: Counter = Counter()
    by_day: dict[str, Counter] = defaultdict(Counter)
    for s in stats_rows:
        by_cat[s.category] += s.quantity
        by_day[s.detection_date.isoformat()][s.category] += s.quantity
    total_objects = sum(by_cat.values())

    categories = []
    for c in CATEGORIES:
        n = by_cat.get(c["id"], 0)
        categories.append({
            "id": c["id"], "name": c["name"], "color": c["color"], "count": n,
            "percentage": round(n * 100 / total_objects, 1) if total_objects else 0.0,
        })

    # Chuỗi ngày liên tục (kể cả ngày không có dữ liệu)
    span = days if days > 0 else min(90, max(7, (today - min((s.detection_date for s in stats_rows), default=today)).days + 1))
    daily = []
    for i in range(span - 1, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        row: dict[str, Any] = {"date": d, "total": sum(by_day[d].values())}
        for cid in CATEGORY_IDS:
            row[cid] = by_day[d].get(cid, 0)
        daily.append(row)

    labels: Counter = Counter()
    label_meta: dict[str, dict[str, str]] = {}
    confidences: list[float] = []
    for r in history_rows:
        for o in r.detected_objects or []:
            key = str(o.get("name") or o.get("label"))
            labels[key] += 1
            label_meta.setdefault(key, {"label": str(o.get("label", key)), "category": str(o.get("category", "other"))})
            if o.get("confidence") is not None:
                confidences.append(float(o["confidence"]))
    top_labels = [{"name": k, "count": n, **label_meta[k]} for k, n in labels.most_common(10)]

    return {
        "range_days": days,
        "total_objects": total_objects,
        "total_images": len(history_rows),
        "images_with_objects": sum(1 for r in history_rows if r.object_count > 0),
        "avg_confidence": round(sum(confidences) / len(confidences), 4) if confidences else None,
        "avg_objects_per_image": round(total_objects / len(history_rows), 2) if history_rows else None,
        "top_category": max(categories, key=lambda c: c["count"])["id"] if total_objects else None,
        "categories": categories,
        "daily": daily,
        "top_labels": top_labels,
    }
