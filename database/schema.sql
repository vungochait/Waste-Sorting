-- Lược đồ tham khảo (SQLite). Backend tự tạo bảng khi khởi động (SQLAlchemy create_all),
-- file này chỉ để đọc hoặc tạo thủ công. File CSDL mặc định: database/ecoai.db

CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      VARCHAR(64)  NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    DATETIME
);

CREATE TABLE IF NOT EXISTS detection_history (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    image_path        VARCHAR(512) NOT NULL,   -- tương đối với backend/uploads
    original_filename VARCHAR(255),
    width             INTEGER,
    height            INTEGER,
    detected_objects  JSON,                    -- [{label, name, category, confidence, bbox, polygons, area_ratio, ...}]
    object_count      INTEGER,
    category          VARCHAR(32),             -- nhóm rác chiếm ưu thế
    confidence        FLOAT,                   -- độ tin cậy trung bình
    source            VARCHAR(16),             -- upload | camera
    timings           JSON,
    model_info        JSON,
    detection_date    DATE NOT NULL,
    created_at        DATETIME
);
CREATE INDEX IF NOT EXISTS ix_history_created ON detection_history (created_at);
CREATE INDEX IF NOT EXISTS ix_history_category ON detection_history (category);
CREATE INDEX IF NOT EXISTS ix_history_date ON detection_history (detection_date);

CREATE TABLE IF NOT EXISTS statistics (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    category       VARCHAR(32) NOT NULL,
    quantity       INTEGER NOT NULL DEFAULT 0,
    detection_date DATE NOT NULL,
    CONSTRAINT uq_stat_cat_date UNIQUE (category, detection_date)
);
