"""Trạng thái hệ thống, cấu hình inference và nạp lại model."""
from __future__ import annotations

from fastapi import APIRouter

from app.config import get_settings
from app.schemas import RuntimeSettings, RuntimeSettingsUpdate
from app.services import class_map
from app.services.model_manager import manager
from app.services.runtime_settings import get_runtime, reset_runtime, update_runtime

router = APIRouter(prefix="/api", tags=["Hệ thống"])


@router.get("/health")
def health():
    status = manager.status()
    return {
        "status": "ok",
        "yolo_ready": status["yolo"]["ready"],
        "sam_ready": status["sam"]["ready"],
        "device": status["device"]["device"],
    }


@router.get("/system/status")
def system_status():
    s = get_settings()
    return {
        "app": {"name": s.app_name, "version": s.app_version},
        "models": manager.status(),
        "runtime": get_runtime().model_dump(),
        "config": {
            "max_upload_mb": s.max_upload_mb,
            "allowed_extensions": sorted(s.extensions),
            "max_image_side": s.max_image_side,
            "sam_backend": s.sam_backend,
            "half_precision": s.half_precision,
            "device_preference": s.device,
            "save_history": s.save_history,
            "class_map": s.class_map,
        },
    }


@router.put("/system/settings", response_model=RuntimeSettings)
def put_settings(patch: RuntimeSettingsUpdate):
    before = get_runtime().sam_enabled
    updated = update_runtime(patch)
    if updated.sam_enabled != before:
        manager.load_all_async()
    return updated


@router.delete("/system/settings", response_model=RuntimeSettings)
def delete_settings():
    return reset_runtime()


@router.post("/system/reload")
def reload_models():
    class_map.reload()
    manager.load_all_async()
    return {"status": "reloading"}


@router.get("/system/class-map")
def get_class_map():
    return {"path": get_settings().class_map, "map": class_map.raw_map()}
