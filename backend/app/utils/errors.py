"""Lỗi nghiệp vụ trả về cho frontend dưới dạng JSON có cấu trúc: {"error": {...}}."""
from __future__ import annotations

from typing import Any, Optional


class EcoAIError(Exception):
    status_code = 400
    code = "BAD_REQUEST"

    def __init__(self, message: str, *, code: Optional[str] = None, status_code: Optional[int] = None,
                 extra: Optional[dict[str, Any]] = None) -> None:
        super().__init__(message)
        self.message = message
        if code:
            self.code = code
        if status_code:
            self.status_code = status_code
        self.extra = extra or {}

    def to_dict(self) -> dict[str, Any]:
        return {"code": self.code, "message": self.message, **self.extra}


class InvalidImageError(EcoAIError):
    status_code = 400
    code = "INVALID_IMAGE"


class UnsupportedImageError(EcoAIError):
    status_code = 415
    code = "UNSUPPORTED_IMAGE_TYPE"


class ImageTooLargeError(EcoAIError):
    status_code = 413
    code = "IMAGE_TOO_LARGE"


class NotFoundError(EcoAIError):
    status_code = 404
    code = "NOT_FOUND"


class ModelUnavailableError(EcoAIError):
    """Model chưa sẵn sàng: thiếu weights, thiếu thư viện hoặc nạp lỗi."""

    status_code = 503
    code = "MODEL_UNAVAILABLE"

    def __init__(self, model: str, reason: str, message: str, *, path: Optional[str] = None,
                 guide: Optional[list[str]] = None, detail: Optional[str] = None) -> None:
        code = {
            "missing_weights": "MODEL_WEIGHTS_MISSING",
            "missing_dependency": "MODEL_DEPENDENCY_MISSING",
            "load_failed": "MODEL_LOAD_FAILED",
            "disabled": "MODEL_DISABLED",
            "loading": "MODEL_LOADING",
        }.get(reason, "MODEL_UNAVAILABLE")
        super().__init__(message, code=code, extra={
            "model": model,
            "reason": reason,
            "path": path,
            "guide": guide or [],
            "detail": detail,
        })
        self.model = model
        self.reason = reason
