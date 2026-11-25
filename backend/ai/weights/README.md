# Model weights

Thư mục này chứa các file weights. Chúng **không** được kèm theo mã nguồn.

```
weights/
├── yolo/ecoai-waste.pt     # YOLO đã huấn luyện cho rác thải  (YOLO_WEIGHTS)
└── sam/sam2.1_b.pt         # SAM 2.1 Base (Ultralytics)        (SAM_WEIGHTS)
```

- **SAM:** chạy `python scripts/download_weights.py --sam sam2.1_b` trong thư mục `backend`.
- **YOLO cho rác thải:** dùng file `.pt` bạn đã có, hoặc tự huấn luyện bằng `python ai/yolo/train.py --data <data.yaml>`.
- **Chỉ để thử nhanh:** `python scripts/download_weights.py --yolo-coco yolov8s` tải model COCO. Model này nhận ra chai, cốc, chuối, điện thoại… nhưng **không** được huấn luyện cho rác thải.

Khi thiếu file, API trả về lỗi `MODEL_WEIGHTS_MISSING` (HTTP 503) kèm hướng dẫn. Frontend hiển thị thông báo này thay vì kết quả.
