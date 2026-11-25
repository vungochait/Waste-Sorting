"""EcoAI – Smart Waste Classification API (FastAPI)."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import init_db
from app.routes import categories, detection, history, statistics, system
from app.services.model_manager import manager
from app.utils.errors import EcoAIError

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")
settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    init_db()
    # Nạp model ở luồng nền để API phản hồi ngay; trạng thái xem tại /api/system/status.
    manager.load_all_async()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Phát hiện rác bằng YOLO, phân đoạn bằng SAM, phân loại vào 6 nhóm rác.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Không bật GZip: nó sẽ gom buffer luồng NDJSON của /api/analyze?stream=true.


@app.exception_handler(EcoAIError)
async def ecoai_error_handler(_: Request, exc: EcoAIError):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.to_dict()})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"error": {
        "code": "VALIDATION_ERROR",
        "message": "Dữ liệu gửi lên không hợp lệ.",
        "details": exc.errors(),
    }})


for module in (detection, history, statistics, categories, system):
    app.include_router(module.router)

settings.upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(settings.upload_path)), name="uploads")


@app.get("/", include_in_schema=False)
def root():
    return {"name": settings.app_name, "docs": "/docs", "health": "/api/health"}
