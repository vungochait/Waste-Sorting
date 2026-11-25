"""Ánh xạ nhãn YOLO -> nhóm rác + hướng dẫn, đọc từ ai/yolo/class_map.yaml."""
from __future__ import annotations

import logging
import re
import threading
from pathlib import Path
from typing import Any

import yaml

from app.config import get_settings
from app.services.categories import CATEGORY_BY_ID, LABEL_GUIDES, build_guide

log = logging.getLogger("ecoai.class_map")
_lock = threading.Lock()
_cache: dict[str, Any] | None = None


def normalize(label: str) -> str:
    return re.sub(r"_+", "_", re.sub(r"[^0-9a-z]+", "_", label.strip().lower())).strip("_")


def _load() -> dict[str, Any]:
    global _cache
    with _lock:
        if _cache is None:
            path: Path = get_settings().resolve(get_settings().class_map)
            data: dict[str, Any] = {}
            if path.is_file():
                try:
                    raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
                    data = {normalize(str(k)): v for k, v in raw.items()}
                except Exception as exc:
                    log.error("Không đọc được %s: %s", path, exc)
            else:
                log.warning("Không tìm thấy class map %s – mọi lớp sẽ thuộc nhóm 'other'.", path)
            _cache = data
        return _cache


def reload() -> None:
    global _cache
    with _lock:
        _cache = None


def raw_map() -> dict[str, Any]:
    return dict(_load())


def classify(label: str) -> dict[str, Any]:
    """Trả về {name, category, instructions, recommendation, bin} cho một nhãn YOLO."""
    key = normalize(label)
    entry = _load().get(key)
    fallback_name = label.replace("_", " ").strip().capitalize() or label

    if isinstance(entry, str):
        guide_key = normalize(entry)
        if guide_key in LABEL_GUIDES:
            return build_guide(guide_key, LABEL_GUIDES[guide_key]["category"], fallback_name)
        if guide_key in CATEGORY_BY_ID:
            return build_guide(None, guide_key, fallback_name)
    elif isinstance(entry, dict):
        category = str(entry.get("category", "other"))
        if category not in CATEGORY_BY_ID:
            category = "other"
        guide_key = entry.get("guide")
        guide = build_guide(normalize(guide_key) if guide_key else None, category, str(entry.get("name") or fallback_name))
        if entry.get("name"):
            guide["name"] = str(entry["name"])
        return guide
    elif key in LABEL_GUIDES:
        return build_guide(key, LABEL_GUIDES[key]["category"], fallback_name)

    return build_guide(None, "other", fallback_name)
