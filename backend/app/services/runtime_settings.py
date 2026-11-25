"""Tham số inference chỉnh được lúc chạy, lưu tại backend/runtime_settings.json."""
from __future__ import annotations

import json
import logging
import threading

from app.config import BACKEND_DIR, get_settings
from app.schemas.system import RuntimeSettings, RuntimeSettingsUpdate

log = logging.getLogger("ecoai.runtime")
_FILE = BACKEND_DIR / "runtime_settings.json"
_lock = threading.Lock()
_current: RuntimeSettings | None = None


def _defaults() -> RuntimeSettings:
    s = get_settings()
    return RuntimeSettings(
        yolo_conf=s.yolo_conf,
        yolo_iou=s.yolo_iou,
        yolo_imgsz=s.yolo_imgsz,
        yolo_max_det=s.yolo_max_det,
        sam_enabled=s.sam_enabled,
    )


def get_runtime() -> RuntimeSettings:
    global _current
    with _lock:
        if _current is None:
            base = _defaults()
            if _FILE.is_file():
                try:
                    stored = json.loads(_FILE.read_text(encoding="utf-8"))
                    base = RuntimeSettings(**{**base.model_dump(), **stored})
                except Exception as exc:
                    log.warning("Bỏ qua runtime_settings.json lỗi: %s", exc)
            _current = base
        return _current


def update_runtime(patch: RuntimeSettingsUpdate) -> RuntimeSettings:
    global _current
    current = get_runtime()
    merged = RuntimeSettings(**{**current.model_dump(), **patch.model_dump(exclude_none=True)})
    with _lock:
        _FILE.write_text(json.dumps(merged.model_dump(), indent=2), encoding="utf-8")
        _current = merged
    return merged


def reset_runtime() -> RuntimeSettings:
    global _current
    with _lock:
        if _FILE.is_file():
            _FILE.unlink()
        _current = None
    return get_runtime()
