"""Kết nối CSDL (SQLite mặc định, PostgreSQL qua DATABASE_URL)."""
from __future__ import annotations

from pathlib import Path
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()
_url = settings.db_url
_is_sqlite = _url.startswith("sqlite")

if _is_sqlite:
    db_file = _url.replace("sqlite:///", "", 1)
    if db_file and db_file != ":memory:":
        Path(db_file).parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    _url,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app import models  # noqa: F401  (đăng ký bảng)

    Base.metadata.create_all(bind=engine)
