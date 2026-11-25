"""Đọc, kiểm tra và lưu ảnh bằng OpenCV."""
from __future__ import annotations

import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

from app.config import get_settings
from app.utils.errors import ImageTooLargeError, InvalidImageError, UnsupportedImageError

_MIME_TO_EXT = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


def validate_upload(filename: Optional[str], content_type: Optional[str], data: bytes) -> None:
    settings = get_settings()
    allowed = settings.extensions
    ext = (Path(filename).suffix.lower().lstrip(".") if filename else "") or _MIME_TO_EXT.get(content_type or "", "")
    if ext not in allowed:
        raise UnsupportedImageError(
            f"Định dạng '{ext or content_type or 'không rõ'}' không được hỗ trợ. Chỉ nhận: {', '.join(sorted(allowed)).upper()}.",
            extra={"allowed": sorted(allowed)},
        )
    if not data:
        raise InvalidImageError("File ảnh rỗng.")
    if len(data) > settings.max_upload_bytes:
        raise ImageTooLargeError(
            f"Ảnh {len(data) / 1024 / 1024:.1f} MB vượt giới hạn {settings.max_upload_mb:g} MB.",
            extra={"max_mb": settings.max_upload_mb},
        )


def decode_image(data: bytes) -> np.ndarray:
    """Giải mã bytes -> ảnh BGR (uint8, 3 kênh) và thu nhỏ nếu cạnh dài vượt MAX_IMAGE_SIDE."""
    arr = np.frombuffer(data, dtype=np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        raise InvalidImageError("Không đọc được ảnh. File có thể bị hỏng hoặc không phải ảnh hợp lệ.")
    return downscale(image, get_settings().max_image_side)


def downscale(image: np.ndarray, max_side: int) -> np.ndarray:
    h, w = image.shape[:2]
    longest = max(h, w)
    if max_side and longest > max_side:
        scale = max_side / float(longest)
        image = cv2.resize(image, (round(w * scale), round(h * scale)), interpolation=cv2.INTER_AREA)
    return image


def save_image(image: np.ndarray) -> str:
    """Lưu ảnh JPEG vào uploads/YYYYMMDD/<uuid>.jpg, trả về đường dẫn tương đối (posix)."""
    settings = get_settings()
    sub = datetime.now().strftime("%Y%m%d")
    folder = settings.upload_path / sub
    folder.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}.jpg"
    ok, buf = cv2.imencode(".jpg", image, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
    if not ok:
        raise InvalidImageError("Không lưu được ảnh.")
    (folder / name).write_bytes(buf.tobytes())
    return f"{sub}/{name}"


def delete_image(relative_path: str) -> None:
    settings = get_settings()
    base = settings.upload_path.resolve()
    target = (base / relative_path).resolve()
    if base in target.parents and target.is_file():
        target.unlink(missing_ok=True)


def image_url(relative_path: Optional[str]) -> Optional[str]:
    return f"/uploads/{relative_path}" if relative_path else None
