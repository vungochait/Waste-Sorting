"""Kiểm tra môi trường: Python, PyTorch, CUDA, thư viện và weights.  python scripts/check_env.py"""
from __future__ import annotations

import importlib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


def main() -> int:
    ok = True
    print(f"Python      : {sys.version.split()[0]}")
    if sys.version_info < (3, 10):
        print("  !! Cần Python 3.10 trở lên")
        ok = False
    for mod in ("fastapi", "uvicorn", "sqlalchemy", "cv2", "numpy", "yaml", "ultralytics", "torch"):
        try:
            m = importlib.import_module(mod)
            print(f"{mod:<12}: {getattr(m, '__version__', 'ok')}")
        except Exception as exc:
            print(f"{mod:<12}: THIẾU ({exc.__class__.__name__})")
            ok = False
    try:
        import torch

        print(f"CUDA        : {'có – ' + torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'không (chạy CPU)'}")
    except Exception:
        pass
    from app.config import get_settings

    s = get_settings()
    for label, value in (("YOLO_WEIGHTS", s.yolo_weights), ("SAM_WEIGHTS", s.sam_weights)):
        path = s.resolve(value)
        print(f"{label:<12}: {'OK ' if path.is_file() else 'THIẾU '}{path}")
        ok = ok and path.is_file()
    print("\nKết quả:", "sẵn sàng" if ok else "còn thiếu thành phần – xem README mục Cấu hình AI models")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
