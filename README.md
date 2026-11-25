# EcoAI – Smart Waste Classification

**Phân loại rác thông minh – Vì một tương lai xanh.**

EcoAI là ứng dụng web nhận diện và phân loại rác từ ảnh hoặc camera trực tiếp:

- **YOLO** (Ultralytics YOLOv8 / YOLO11) phát hiện vật thể, trả về bounding box, nhãn và độ tin cậy.
- **SAM / SAM 2** (Segment Anything) nhận bounding box của YOLO làm prompt và tạo segmentation mask cho từng vật thể.
- Mỗi nhãn được ánh xạ vào **6 nhóm rác**: hữu cơ, tái chế, vô cơ, nguy hại, điện tử, khác. Mỗi nhóm có hướng dẫn xử lý và khuyến nghị tái chế riêng.
- Kết quả được lưu vào lịch sử (SQLite/PostgreSQL) và tổng hợp thành dashboard thống kê.

> **Không có kết quả giả.** Khi thiếu model weights, API trả về lỗi `MODEL_WEIGHTS_MISSING` (HTTP 503) kèm hướng dẫn. Giao diện hiển thị thông báo này thay vì kết quả.

---

## 1. Công nghệ

| Phần | Công nghệ |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, Recharts, React Router |
| Backend | Python 3.10–3.12, FastAPI, SQLAlchemy 2, OpenCV, Pydantic |
| AI | Ultralytics (YOLO + SAM / SAM 2.1), PyTorch (CUDA hoặc CPU), tùy chọn `facebookresearch/sam2` |
| CSDL | SQLite (mặc định) hoặc PostgreSQL |

## 2. Cấu trúc thư mục

```
ecoai/
├── frontend/
│   ├── src/
│   │   ├── components/   ResultViewer (box + mask + zoom + so sánh), ObjectCard, StageProgress, ErrorPanel…
│   │   ├── pages/        Home, Detect, Camera, Statistics, History, Knowledge, Settings
│   │   ├── layouts/      AppLayout (sidebar + menu di động)
│   │   ├── services/     api.ts (REST + NDJSON stream), types, categories, format
│   │   ├── hooks/        useSystemStatus, useWebcam, useDebounce
│   │   └── assets/
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py       FastAPI app, CORS, xử lý lỗi, /uploads tĩnh
│   │   ├── routes/       detection, history, statistics, categories, system
│   │   ├── models/       User, DetectionHistory, Statistics (SQLAlchemy)
│   │   ├── services/     pipeline YOLO+SAM, model_manager, class_map, history, statistics
│   │   ├── schemas/      Pydantic
│   │   └── utils/        image (OpenCV), masks (mask → polygon), errors
│   ├── ai/
│   │   ├── yolo/         detector.py, class_map.yaml, train.py, dataset.example.yaml
│   │   ├── sam/          segmenter.py (Ultralytics SAM hoặc SAM 2 gốc)
│   │   └── weights/      đặt file .pt tại đây (không kèm theo mã nguồn)
│   ├── scripts/          download_weights.py, check_env.py
│   ├── tests/            pytest
│   ├── uploads/          ảnh đã phân tích
│   └── requirements.txt
├── database/             ecoai.db (SQLite, tự tạo) + schema.sql tham khảo
├── setup.ps1 · start-backend.ps1 · start-frontend.ps1
├── README.md
└── .env.example
```

## 3. Yêu cầu

- **Python 3.10 – 3.12** (Windows: tick “Add python.exe to PATH” khi cài)
- **Node.js 18+** (khuyên dùng 20 LTS)
- Tùy chọn: GPU NVIDIA và driver mới (CUDA 12.x) để chạy nhanh. Không có GPU vẫn chạy được trên CPU.

## 4. Cài đặt

### Cách nhanh (Windows PowerShell)

```powershell
cd ecoai
.\setup.ps1          # tự chọn PyTorch CUDA nếu có nvidia-smi, ngược lại CPU
```

Nếu PowerShell chặn script: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

### Cài thủ công

**Backend**

```powershell
cd ecoai\backend
python -m venv .venv
.venv\Scripts\activate                     # macOS/Linux: source .venv/bin/activate

# 1) PyTorch – chọn MỘT dòng
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124   # GPU NVIDIA
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu     # chỉ CPU

# 2) Thư viện còn lại
pip install -r requirements.txt

# 3) Cấu hình
copy ..\.env.example ..\.env               # macOS/Linux: cp ../.env.example ../.env
```

**Frontend**

```powershell
cd ecoai\frontend
npm install
```

## 5. Cấu hình AI models

Mặc định backend tìm hai file sau (đường dẫn tính từ `backend/`, đổi trong `.env`):

| Biến | Mặc định | Vai trò |
|---|---|---|
| `YOLO_WEIGHTS` | `ai/weights/yolo/ecoai-waste.pt` | Phát hiện + phân loại rác |
| `SAM_WEIGHTS` | `ai/weights/sam/sam2.1_b.pt` | Phân đoạn |

### 5.1 SAM 2.1 (tải sẵn được)

```powershell
cd backend
python scripts/download_weights.py --sam sam2.1_b     # GPU: base, cân bằng
python scripts/download_weights.py --sam sam2.1_t     # CPU / máy yếu: tiny
```

Nếu dùng bản tiny, sửa `.env`: `SAM_WEIGHTS=ai/weights/sam/sam2.1_t.pt`.

Muốn dùng thư viện SAM 2 gốc của Meta:

```powershell
pip install "git+https://github.com/facebookresearch/sam2.git"
```

Sau đó đặt `SAM_BACKEND=sam2`, `SAM_WEIGHTS=` trỏ tới checkpoint (ví dụ `sam2.1_hiera_base_plus.pt`) và `SAM2_CONFIG=configs/sam2.1/sam2.1_hiera_b+.yaml`.

### 5.2 YOLO cho rác thải

Không có bộ weights “rác thải” chính thức để tải về. Có ba lựa chọn:

1. **Dùng weights bạn đã có.** Chép file `.pt` vào `backend/ai/weights/yolo/ecoai-waste.pt`, hoặc sửa `YOLO_WEIGHTS`.
2. **Tự huấn luyện** trên dataset định dạng YOLO (TACO, TrashNet, Roboflow hoặc ảnh tự gán nhãn). Mẫu `data.yaml` ở `ai/yolo/dataset.example.yaml`:
   ```powershell
   cd backend
   python ai/yolo/train.py --data D:/datasets/my-waste/data.yaml --model yolov8s.pt --epochs 100
   ```
   Khi xong, script chép `best.pt` vào `ai/weights/yolo/ecoai-waste.pt`.
3. **Chỉ để thử nhanh:** dùng model COCO. Model này nhận ra chai, cốc, chuối, điện thoại… nhưng **không** được huấn luyện cho rác thải.
   ```powershell
   python scripts/download_weights.py --yolo-coco yolov8s
   # .env: YOLO_WEIGHTS=ai/weights/yolo/yolov8s.pt
   ```

### 5.3 Ánh xạ nhãn → nhóm rác

Mỗi tên lớp YOLO được xếp vào một trong 6 nhóm theo `backend/ai/yolo/class_map.yaml`. File đã có sẵn các tên lớp phổ biến của TACO, TrashNet và COCO. Lớp không có trong file sẽ thuộc **Rác khác**. Ví dụ:

```yaml
plastic_bottle: plastic_bottle                         # dùng hướng dẫn có sẵn
my_custom_class: {category: recyclable, name: Hộp sữa} # tự định nghĩa
```

### 5.4 Kiểm tra

```powershell
cd backend
python scripts/check_env.py
```

Trang **Cài đặt** trên web cũng hiển thị trạng thái từng model, thiết bị (CUDA/CPU), danh sách lớp và hướng dẫn khi thiếu file. Sau khi thêm weights, bấm **Tải lại model**, không cần khởi động lại.

## 6. Khởi chạy

Mở hai cửa sổ terminal:

```powershell
.\start-backend.ps1      # = cd backend; .venv\Scripts\activate; uvicorn app.main:app --host 127.0.0.1 --port 8000
```

```powershell
.\start-frontend.ps1     # = cd frontend; npm run dev
```

- Web: http://localhost:5173
- Tài liệu API (Swagger): http://127.0.0.1:8000/docs

Camera chỉ hoạt động trên `localhost` hoặc HTTPS (quy định bảo mật của trình duyệt). Để dùng điện thoại trong cùng mạng LAN, chạy frontend qua HTTPS hoặc build rồi phục vụ sau một reverse proxy có TLS.

### Build production

```powershell
cd frontend
npm run build            # tạo frontend/dist
npm run preview          # thử bản build tại http://localhost:4173 (proxy /api tới backend)
```

### Triển khai frontend trên Netlify

`netlify.toml` ở thư mục gốc cấu hình Netlify build từ `frontend/` và xuất bản `frontend/dist/`. Các đường dẫn như `/detect` và `/history` được chuyển về `index.html` để React Router xử lý.

Cấu hình này chỉ triển khai frontend. Để sử dụng các tính năng gọi API, backend FastAPI cần có địa chỉ HTTPS riêng; đặt `VITE_API_URL` thành địa chỉ đó trước khi build và thêm origin của frontend vào `CORS_ORIGINS` của backend. Proxy trong Vite chỉ dùng khi chạy `dev` hoặc `preview`.

## 7. API

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/detect` | `file` → YOLO: bbox, nhãn, confidence, nhóm rác, `image_id` (giữ trong bộ nhớ đệm để gọi segment) |
| POST | `/api/segment` | `boxes` (JSON `[[x1,y1,x2,y2],…]`) + `image_id` hoặc `file` → SAM: polygon mask, diện tích |
| POST | `/api/analyze` | Toàn bộ pipeline YOLO → SAM → phân loại → lưu lịch sử. `?stream=true` trả NDJSON theo từng giai đoạn |
| GET | `/api/statistics?days=14` | Tổng vật thể, tổng ảnh, theo nhóm, theo ngày, top loại rác (`days=0`: toàn bộ) |
| GET | `/api/history` | `search`, `category`, `date_from`, `date_to`, `page`, `page_size` |
| GET | `/api/history/{id}` | Chi tiết một lần nhận diện |
| DELETE | `/api/history/{id}` | Xóa bản ghi và ảnh, trừ số liệu thống kê tương ứng |
| DELETE | `/api/history?confirm=true` | Xóa toàn bộ lịch sử |
| GET | `/api/categories` | 6 nhóm rác + hướng dẫn theo loại vật thể |
| GET | `/api/health` | Trạng thái nhanh |
| GET | `/api/system/status` | Trạng thái model, thiết bị, cấu hình |
| PUT | `/api/system/settings` | Đổi `yolo_conf`, `yolo_iou`, `yolo_imgsz`, `yolo_max_det`, `sam_enabled` |
| POST | `/api/system/reload` | Nạp lại model và class map |

Lỗi luôn có dạng `{"error": {"code", "message", ...}}`. Ví dụ khi thiếu weights:

```json
{"error": {"code": "MODEL_WEIGHTS_MISSING", "model": "yolo",
  "message": "Không tìm thấy model weights YOLO: backend/ai/weights/yolo/ecoai-waste.pt",
  "path": "ai/weights/yolo/ecoai-waste.pt", "guide": ["Đặt file weights …", "…"]}}
```

Mã lỗi khác: `UNSUPPORTED_IMAGE_TYPE` (415), `IMAGE_TOO_LARGE` (413), `INVALID_IMAGE` (400), `MODEL_LOADING` (503), `MODEL_DEPENDENCY_MISSING` (503).

## 8. Hiệu năng

- Model được nạp **một lần** khi khởi động (luồng nền), có warm-up, chạy **FP16 trên GPU** (`HALF_PRECISION`).
- Ảnh được thu nhỏ về `MAX_IMAGE_SIDE` (mặc định 1920 px) trước khi suy luận.
- SAM chạy **một lần cho tất cả box** của ảnh (một lần encode ảnh).
- **Camera:** khung hình được thu nhỏ (480–960 px) và gửi tuần tự. Khung mới chỉ gửi khi khung trước đã có kết quả nên không dồn hàng đợi. Chỉ chạy SAM cho vật thể người dùng chọn, và theo dõi vật thể đó giữa các khung bằng IoU.
- CPU: dùng `sam2.1_t`, `YOLO_IMGSZ=480–640`, hoặc tắt SAM trong Cài đặt cho camera.

## 9. Kiểm thử

```powershell
cd backend
pip install -r requirements-dev.txt
pytest -q
```

Bộ test chạy **không cần weights**. Nó kiểm tra rằng API trả lỗi rõ ràng chứ không bao giờ trả kết quả giả, kiểm tra validate định dạng/dung lượng ảnh, class map, mask → polygon, lịch sử, thống kê và cài đặt.

Frontend: `npm run typecheck` và `npm run build`.

## 10. Xử lý sự cố

| Hiện tượng | Cách xử lý |
|---|---|
| “Không kết nối được backend” | Backend chưa chạy hoặc khác cổng. Chạy `start-backend.ps1`; nếu đổi cổng thì sửa `BACKEND_URL` trong `frontend/.env`. |
| “Chưa có model weights YOLO/SAM” | Làm theo mục 5, rồi bấm **Tải lại model** trong Cài đặt. |
| Trang Cài đặt báo CUDA “không” dù có GPU | Bạn đang dùng PyTorch bản CPU. Cài lại bằng dòng `--index-url …/cu124`. |
| Camera không bật | Cho phép quyền camera trên trình duyệt; chỉ chạy trên `localhost`/HTTPS. |
| Nhận diện sai nhóm | Thêm hoặc sửa dòng trong `ai/yolo/class_map.yaml`, rồi **Tải lại model**. |
| Chậm trên CPU | Dùng `sam2.1_t`, giảm `imgsz`, giảm khung/giây trong Camera AI. |
