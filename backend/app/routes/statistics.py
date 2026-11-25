from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.statistics_service import get_statistics

router = APIRouter(prefix="/api", tags=["Thống kê"])


@router.get("/statistics")
def statistics(days: int = Query(14, ge=0, le=365, description="Số ngày gần nhất; 0 = toàn bộ"),
               db: Session = Depends(get_db)):
    return get_statistics(db, days)
