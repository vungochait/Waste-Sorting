"""GET /api/history, GET /api/history/{id}, DELETE /api/history/{id}, DELETE /api/history."""
from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import HistoryItem, HistoryList
from app.services import history_service
from app.services.categories import CATEGORY_IDS
from app.utils.errors import EcoAIError

router = APIRouter(prefix="/api/history", tags=["Lịch sử"])


@router.get("", response_model=HistoryList)
def list_history(
    search: Optional[str] = Query(None, description="Tìm theo tên file hoặc tên vật thể"),
    category: Optional[str] = Query(None, description="Lọc theo nhóm rác"),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    if category and category not in CATEGORY_IDS:
        raise EcoAIError(f"Nhóm rác không hợp lệ: {category}", code="INVALID_CATEGORY")
    return history_service.list_history(db, search=search, category=category, date_from=date_from,
                                        date_to=date_to, page=page, page_size=page_size)


@router.get("/{history_id}", response_model=HistoryItem)
def get_history(history_id: int, db: Session = Depends(get_db)):
    return history_service.to_item(history_service.get_history(db, history_id))


@router.delete("/{history_id}")
def delete_history(history_id: int, db: Session = Depends(get_db)):
    history_service.delete_history(db, history_id)
    return {"deleted": history_id}


@router.delete("")
def clear_history(confirm: bool = Query(False, description="Phải là true để xóa toàn bộ"), db: Session = Depends(get_db)):
    if not confirm:
        raise EcoAIError("Thêm ?confirm=true để xóa toàn bộ lịch sử.", code="CONFIRM_REQUIRED")
    return {"deleted": history_service.clear_history(db)}
