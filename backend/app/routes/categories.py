from __future__ import annotations

from fastapi import APIRouter

from app.services.categories import CATEGORIES, LABEL_GUIDES

router = APIRouter(prefix="/api", tags=["Nhóm rác"])


@router.get("/categories")
def categories():
    return {"categories": CATEGORIES, "label_guides": LABEL_GUIDES}
