"""Chạy backend: python run.py  (đọc API_HOST / API_PORT từ .env)."""
import uvicorn

from app.config import get_settings

if __name__ == "__main__":
    s = get_settings()
    uvicorn.run("app.main:app", host=s.api_host, port=s.api_port, reload=False)
