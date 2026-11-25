"""Tải weights có sẵn công khai vào backend/ai/weights/.

    python scripts/download_weights.py --sam sam2.1_b          # SAM 2.1 Base (khuyên dùng với GPU)
    python scripts/download_weights.py --sam sam2.1_t          # SAM 2.1 Tiny (nhẹ, hợp CPU)
    python scripts/download_weights.py --yolo-coco yolov8s     # YOLOv8 COCO – CHỈ để thử, không chuyên rác thải

Không có weights YOLO "rác thải" chính thức để tải: hãy dùng model của bạn hoặc huấn luyện bằng ai/yolo/train.py.
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
WEIGHTS = BACKEND_DIR / "ai" / "weights"
SAM_CHOICES = ["sam2.1_t", "sam2.1_s", "sam2.1_b", "sam2.1_l", "sam2_t", "sam2_s", "sam2_b", "sam2_l",
               "sam_b", "sam_l", "mobile_sam"]
YOLO_CHOICES = ["yolov8n", "yolov8s", "yolov8m", "yolov8l", "yolo11n", "yolo11s", "yolo11m"]


def fetch(name: str, dest_dir: Path) -> Path:
    from ultralytics.utils.downloads import attempt_download_asset

    dest_dir.mkdir(parents=True, exist_ok=True)
    target = dest_dir / f"{name}.pt"
    if target.is_file():
        print(f"[EcoAI] Đã có {target}")
        return target
    downloaded = Path(attempt_download_asset(str(target)))
    if downloaded.resolve() != target.resolve() and downloaded.is_file():
        shutil.move(str(downloaded), target)
    if not target.is_file():
        raise RuntimeError(f"Tải {name}.pt thất bại – kiểm tra kết nối mạng.")
    print(f"[EcoAI] Đã tải {target}")
    return target


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--sam", choices=SAM_CHOICES, help="Tải weights SAM cho Ultralytics")
    p.add_argument("--yolo-coco", choices=YOLO_CHOICES, help="Tải YOLO COCO để thử nhanh (không chuyên rác)")
    args = p.parse_args()
    if not args.sam and not args.yolo_coco:
        p.print_help()
        return 1
    try:
        if args.sam:
            path = fetch(args.sam, WEIGHTS / "sam")
            print(f"[EcoAI] Đặt trong .env: SAM_WEIGHTS=ai/weights/sam/{path.name}")
        if args.yolo_coco:
            path = fetch(args.yolo_coco, WEIGHTS / "yolo")
            print(f"[EcoAI] Đặt trong .env: YOLO_WEIGHTS=ai/weights/yolo/{path.name}")
            print("[EcoAI] Lưu ý: model COCO không được huấn luyện cho rác thải; nhãn được ánh xạ qua class_map.yaml.")
    except ImportError:
        print("[EcoAI] Chưa cài ultralytics. Chạy: pip install -r requirements.txt", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
