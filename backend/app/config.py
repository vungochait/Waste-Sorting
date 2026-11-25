"""Cấu hình ứng dụng, đọc từ biến môi trường / file .env."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(PROJECT_DIR / ".env"), str(BACKEND_DIR / ".env")),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "EcoAI – Smart Waste Classification"
    app_version: str = "1.0.0"

    api_host: str = "127.0.0.1"
    api_port: int = 8000
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Để trống -> SQLite tại <project>/database/ecoai.db
    database_url: str = ""

    upload_dir: str = "uploads"
    max_upload_mb: float = 10.0
    max_image_side: int = 1920
    allowed_extensions: str = "jpg,jpeg,png,webp"

    # auto | cuda | cuda:0 | cpu
    device: str = "auto"
    half_precision: bool = True

    yolo_weights: str = "ai/weights/yolo/ecoai-waste.pt"
    yolo_conf: float = 0.35
    yolo_iou: float = 0.45
    yolo_imgsz: int = 640
    yolo_max_det: int = 50
    class_map: str = "ai/yolo/class_map.yaml"

    sam_enabled: bool = True
    # ultralytics (SAM, SAM 2, SAM 2.1 qua Ultralytics) | sam2 (thư viện gốc của Meta)
    sam_backend: str = "ultralytics"
    sam_weights: str = "ai/weights/sam/sam2.1_b.pt"
    # Chỉ dùng khi SAM_BACKEND=sam2
    sam2_config: str = "configs/sam2.1/sam2.1_hiera_b+.yaml"

    # Lưu ảnh đã phân tích vào lịch sử
    save_history: bool = True

    def resolve(self, value: str) -> Path:
        path = Path(value)
        return path if path.is_absolute() else (BACKEND_DIR / path).resolve()

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def extensions(self) -> set[str]:
        return {e.strip().lower().lstrip(".") for e in self.allowed_extensions.split(",") if e.strip()}

    @property
    def max_upload_bytes(self) -> int:
        return int(self.max_upload_mb * 1024 * 1024)

    @property
    def db_url(self) -> str:
        if self.database_url:
            return self.database_url
        return f"sqlite:///{(PROJECT_DIR / 'database' / 'ecoai.db').as_posix()}"

    @property
    def upload_path(self) -> Path:
        return self.resolve(self.upload_dir)


@lru_cache
def get_settings() -> Settings:
    return Settings()
