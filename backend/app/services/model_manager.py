"""Quản lý vòng đời model YOLO và SAM: nạp, trạng thái, lỗi thiếu weights."""
from __future__ import annotations

import logging
import threading
from pathlib import Path
from typing import Any, Optional

from ai.device import device_info, resolve_device, torch_available
from ai.sam.segmenter import SamSegmenter
from ai.yolo.detector import YoloDetector
from app.config import BACKEND_DIR, get_settings
from app.utils.errors import ModelUnavailableError

log = logging.getLogger("ecoai.models")


def _rel(path: Path) -> str:
    try:
        return path.relative_to(BACKEND_DIR).as_posix()
    except ValueError:
        return str(path)


def yolo_guide(path: Path) -> list[str]:
    return [
        f"Đặt file weights YOLO đã huấn luyện cho rác thải tại backend/{_rel(path)} "
        "hoặc sửa YOLO_WEIGHTS trong file .env.",
        "Chưa có model? Huấn luyện từ dataset rác thải (TACO, TrashNet hoặc dữ liệu của bạn): "
        "cd backend && python ai/yolo/train.py --data <đường-dẫn>/data.yaml",
        "Chỉ để thử nhanh: python scripts/download_weights.py --yolo-coco yolov8s, sau đó đặt "
        "YOLO_WEIGHTS=ai/weights/yolo/yolov8s.pt (model COCO, không chuyên cho rác thải).",
        "Khởi động lại backend hoặc bấm “Tải lại model” trong trang Cài đặt.",
    ]


def sam_guide(path: Path, backend: str) -> list[str]:
    if backend == "sam2":
        return [
            'Cài SAM 2 bản gốc: pip install "git+https://github.com/facebookresearch/sam2.git"',
            f"Tải checkpoint SAM 2.1 (ví dụ sam2.1_hiera_base_plus.pt) vào backend/{_rel(path)}.",
            "Đặt SAM2_CONFIG khớp checkpoint, ví dụ configs/sam2.1/sam2.1_hiera_b+.yaml.",
            "Khởi động lại backend hoặc bấm “Tải lại model” trong trang Cài đặt.",
        ]
    return [
        "Tải SAM 2.1 cho Ultralytics: cd backend && python scripts/download_weights.py --sam sam2.1_b "
        "(hoặc sam2.1_t nếu máy yếu / chỉ có CPU).",
        f"Đảm bảo SAM_WEIGHTS trong .env trỏ tới backend/{_rel(path)}.",
        "Khởi động lại backend hoặc bấm “Tải lại model” trong trang Cài đặt.",
    ]


DEPENDENCY_GUIDE = [
    "Cài PyTorch phù hợp phần cứng: GPU NVIDIA → pip install torch torchvision --index-url "
    "https://download.pytorch.org/whl/cu124 ; chỉ CPU → --index-url https://download.pytorch.org/whl/cpu",
    "Cài thư viện còn lại: pip install -r requirements.txt",
    "Khởi động lại backend.",
]


class _Slot:
    def __init__(self, name: str) -> None:
        self.name = name
        self.state = "not_loaded"  # not_loaded | loading | ready | error | disabled
        self.error: Optional[ModelUnavailableError] = None
        self.instance: Any = None


class ModelManager:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.yolo = _Slot("yolo")
        self.sam = _Slot("sam")
        self.device = "cpu"

    # ----- nạp model -----
    def load_all_async(self) -> None:
        threading.Thread(target=self.load_all, name="ecoai-model-loader", daemon=True).start()

    def load_all(self) -> None:
        with self._lock:
            settings = get_settings()
            self.device = resolve_device(settings.device)
            self._load_yolo(settings)
            self._load_sam(settings)

    def _load_yolo(self, settings) -> None:
        slot = self.yolo
        path = settings.resolve(settings.yolo_weights)
        slot.state, slot.error, slot.instance = "loading", None, None
        if not torch_available():
            slot.state = "error"
            slot.error = ModelUnavailableError("yolo", "missing_dependency",
                                               "Chưa cài PyTorch nên không thể chạy YOLO.", guide=DEPENDENCY_GUIDE)
            return
        if not path.is_file():
            slot.state = "error"
            slot.error = ModelUnavailableError(
                "yolo", "missing_weights",
                f"Không tìm thấy model weights YOLO: backend/{_rel(path)}",
                path=_rel(path), guide=yolo_guide(path))
            log.warning(slot.error.message)
            return
        try:
            det = YoloDetector(path, device=self.device, half=settings.half_precision)
            det.load()
            slot.instance, slot.state = det, "ready"
        except ImportError as exc:
            slot.state = "error"
            slot.error = ModelUnavailableError("yolo", "missing_dependency", "Thiếu thư viện ultralytics.",
                                               guide=DEPENDENCY_GUIDE, detail=str(exc))
        except Exception as exc:
            log.exception("Nạp YOLO lỗi")
            slot.state = "error"
            slot.error = ModelUnavailableError("yolo", "load_failed", f"Nạp YOLO thất bại: {exc}",
                                               path=_rel(path), guide=yolo_guide(path), detail=repr(exc))

    def _load_sam(self, settings) -> None:
        from app.services.runtime_settings import get_runtime

        slot = self.sam
        path = settings.resolve(settings.sam_weights)
        slot.state, slot.error, slot.instance = "loading", None, None
        if not get_runtime().sam_enabled:
            slot.state = "disabled"
            return
        if not torch_available():
            slot.state = "error"
            slot.error = ModelUnavailableError("sam", "missing_dependency",
                                               "Chưa cài PyTorch nên không thể chạy SAM.", guide=DEPENDENCY_GUIDE)
            return
        if not path.is_file():
            slot.state = "error"
            slot.error = ModelUnavailableError(
                "sam", "missing_weights",
                f"Không tìm thấy model weights SAM: backend/{_rel(path)}",
                path=_rel(path), guide=sam_guide(path, settings.sam_backend))
            log.warning(slot.error.message)
            return
        try:
            seg = SamSegmenter(path, backend=settings.sam_backend, device=self.device,
                               sam2_config=settings.sam2_config)
            seg.load()
            slot.instance, slot.state = seg, "ready"
        except ImportError as exc:
            slot.state = "error"
            guide = sam_guide(path, settings.sam_backend)
            slot.error = ModelUnavailableError("sam", "missing_dependency",
                                               f"Thiếu thư viện cho SAM backend '{settings.sam_backend}'.",
                                               guide=guide, detail=str(exc))
        except Exception as exc:
            log.exception("Nạp SAM lỗi")
            slot.state = "error"
            slot.error = ModelUnavailableError("sam", "load_failed", f"Nạp SAM thất bại: {exc}",
                                               path=_rel(path), guide=sam_guide(path, settings.sam_backend),
                                               detail=repr(exc))

    # ----- truy cập -----
    def _require(self, slot: _Slot) -> Any:
        if slot.state == "ready":
            return slot.instance
        if slot.state in ("loading", "not_loaded"):
            raise ModelUnavailableError(slot.name, "loading", "Model đang được nạp, vui lòng thử lại sau vài giây.")
        if slot.state == "disabled":
            raise ModelUnavailableError(slot.name, "disabled", "SAM đang tắt trong Cài đặt.")
        raise slot.error or ModelUnavailableError(slot.name, "load_failed", "Model chưa sẵn sàng.")

    def require_yolo(self) -> YoloDetector:
        return self._require(self.yolo)

    def require_sam(self) -> SamSegmenter:
        return self._require(self.sam)

    def sam_ready(self) -> bool:
        return self.sam.state == "ready"

    # ----- trạng thái -----
    def _slot_status(self, slot: _Slot, path: Path, extra: dict[str, Any]) -> dict[str, Any]:
        return {
            "state": slot.state,
            "ready": slot.state == "ready",
            "weights": _rel(path),
            "weights_exists": path.is_file(),
            "error": slot.error.to_dict() if slot.error else None,
            **extra,
        }

    def model_info(self) -> dict[str, Any]:
        settings = get_settings()
        return {
            "yolo": Path(settings.yolo_weights).name,
            "sam": Path(settings.sam_weights).name if self.sam_ready() else None,
            "sam_backend": settings.sam_backend,
            "device": self.device,
        }

    def status(self) -> dict[str, Any]:
        settings = get_settings()
        yolo_path = settings.resolve(settings.yolo_weights)
        sam_path = settings.resolve(settings.sam_weights)
        det: Optional[YoloDetector] = self.yolo.instance
        return {
            "device": device_info(settings.device),
            "yolo": self._slot_status(self.yolo, yolo_path, {
                "classes": det.names if det else None,
                "task": det.task if det else None,
            }),
            "sam": self._slot_status(self.sam, sam_path, {"backend": settings.sam_backend}),
        }


manager = ModelManager()
