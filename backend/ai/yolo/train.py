"""Huấn luyện YOLO cho bài toán phát hiện rác thải và chép weights vào ai/weights/yolo/.

Ví dụ (chạy trong thư mục backend):
    python ai/yolo/train.py --data D:/datasets/taco-yolo/data.yaml --model yolov8s.pt --epochs 100

Dataset theo định dạng YOLO (images/, labels/, data.yaml). Xem ai/yolo/dataset.example.yaml.
Tên lớp trong data.yaml nên có trong ai/yolo/class_map.yaml để được xếp đúng nhóm rác.
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_OUT = BACKEND_DIR / "ai" / "weights" / "yolo" / "ecoai-waste.pt"


def main() -> int:
    parser = argparse.ArgumentParser(description="Huấn luyện YOLO phát hiện rác thải")
    parser.add_argument("--data", required=True, help="Đường dẫn data.yaml của dataset YOLO")
    parser.add_argument("--model", default="yolov8s.pt", help="Model khởi tạo (yolov8n/s/m.pt, yolo11s.pt...)")
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--device", default=None, help="0 (GPU đầu tiên) hoặc cpu; mặc định tự chọn")
    parser.add_argument("--name", default="ecoai-waste")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="Nơi chép best.pt sau khi huấn luyện")
    args = parser.parse_args()

    data = Path(args.data)
    if not data.is_file():
        print(f"[EcoAI] Không tìm thấy {data}", file=sys.stderr)
        return 1

    from ultralytics import YOLO

    model = YOLO(args.model)
    train_kwargs = dict(data=str(data), epochs=args.epochs, imgsz=args.imgsz, batch=args.batch,
                        project=str(BACKEND_DIR / "runs"), name=args.name, exist_ok=True)
    if args.device is not None:
        train_kwargs["device"] = args.device
    model.train(**train_kwargs)

    best = BACKEND_DIR / "runs" / args.name / "weights" / "best.pt"
    if not best.is_file():
        print(f"[EcoAI] Không thấy {best}. Kiểm tra log huấn luyện.", file=sys.stderr)
        return 1
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(best, out)
    print(f"[EcoAI] Đã chép weights: {out}")
    print("[EcoAI] Đặt YOLO_WEIGHTS trỏ tới file này (mặc định đã đúng) rồi khởi động lại backend.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
