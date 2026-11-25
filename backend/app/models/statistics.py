from __future__ import annotations

from datetime import date

from sqlalchemy import Date, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Statistics(Base):
    """Số lượng vật thể theo nhóm rác theo từng ngày."""

    __tablename__ = "statistics"
    __table_args__ = (UniqueConstraint("category", "detection_date", name="uq_stat_cat_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category: Mapped[str] = mapped_column(String(32), index=True)
    quantity: Mapped[int] = mapped_column(Integer, default=0)
    detection_date: Mapped[date] = mapped_column(Date, index=True)
