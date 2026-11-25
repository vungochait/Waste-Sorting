"""Chọn thiết bị inference: GPU CUDA nếu có, ngược lại CPU."""
from __future__ import annotations

import logging
from typing import Any

log = logging.getLogger("ecoai.device")


def torch_available() -> bool:
    try:
        import torch  # noqa: F401

        return True
    except Exception:  # pragma: no cover
        return False


def resolve_device(preference: str = "auto") -> str:
    pref = (preference or "auto").strip().lower()
    try:
        import torch
    except Exception:
        return "cpu"
    if pref == "cpu":
        return "cpu"
    if torch.cuda.is_available():
        return pref if pref.startswith("cuda:") else "cuda:0"
    if pref.startswith("cuda"):
        log.warning("DEVICE=%s nhưng không tìm thấy GPU CUDA – chuyển sang CPU.", preference)
    return "cpu"


def device_info(preference: str = "auto") -> dict[str, Any]:
    info: dict[str, Any] = {
        "preference": preference,
        "device": "cpu",
        "torch_installed": False,
        "torch_version": None,
        "cuda_available": False,
        "cuda_version": None,
        "gpu_name": None,
    }
    try:
        import torch
    except Exception:
        return info
    info["torch_installed"] = True
    info["torch_version"] = torch.__version__
    info["cuda_available"] = bool(torch.cuda.is_available())
    info["cuda_version"] = getattr(torch.version, "cuda", None)
    if info["cuda_available"]:
        try:
            info["gpu_name"] = torch.cuda.get_device_name(0)
        except Exception:
            pass
    info["device"] = resolve_device(preference)
    return info
