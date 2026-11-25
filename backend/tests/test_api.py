"""Kiểm thử API không cần model weights.  Chạy: cd backend && pytest -q"""
from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np
import pytest

_tmp = Path(tempfile.mkdtemp(prefix="ecoai-test-"))
os.environ["DATABASE_URL"] = f"sqlite:///{(_tmp / 'test.db').as_posix()}"
os.environ["UPLOAD_DIR"] = str(_tmp / "uploads")
os.environ["YOLO_WEIGHTS"] = str(_tmp / "khong-ton-tai.pt")
os.environ["SAM_WEIGHTS"] = str(_tmp / "khong-ton-tai-sam.pt")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.services import class_map  # noqa: E402
from app.services.model_manager import manager  # noqa: E402
from app.utils.errors import ImageTooLargeError, UnsupportedImageError  # noqa: E402
from app.utils.image import validate_upload  # noqa: E402
from app.utils.masks import mask_stats, mask_to_polygons  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        manager.load_all()  # đồng bộ, để trạng thái lỗi đã xác định
        yield c


def _jpeg() -> bytes:
    img = np.full((120, 160, 3), 200, dtype=np.uint8)
    ok, buf = cv2.imencode(".jpg", img)
    assert ok
    return buf.tobytes()


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["yolo_ready"] is False


def test_categories(client):
    data = client.get("/api/categories").json()
    ids = [c["id"] for c in data["categories"]]
    assert ids == ["organic", "recyclable", "nonrecyclable", "hazardous", "ewaste", "other"]


def test_detect_without_weights_returns_clear_error(client):
    r = client.post("/api/detect", files={"file": ("a.jpg", _jpeg(), "image/jpeg")})
    assert r.status_code == 503
    err = r.json()["error"]
    assert err["code"] in ("MODEL_WEIGHTS_MISSING", "MODEL_DEPENDENCY_MISSING")
    assert err["model"] == "yolo"
    assert err["guide"], "phải kèm hướng dẫn cấu hình"


def test_analyze_without_weights_never_fakes_result(client):
    r = client.post("/api/analyze", files={"file": ("a.jpg", _jpeg(), "image/jpeg")})
    assert r.status_code == 503
    assert "objects" not in r.json()


def test_statistics_and_history_empty(client):
    s = client.get("/api/statistics?days=7").json()
    assert s["total_objects"] == 0 and s["total_images"] == 0
    assert len(s["daily"]) == 7
    h = client.get("/api/history").json()
    assert h["total"] == 0 and h["items"] == []


def test_delete_missing_history_404(client):
    assert client.delete("/api/history/999").status_code == 404


def test_clear_history_requires_confirm(client):
    assert client.delete("/api/history").status_code == 400


def test_system_status_and_settings(client):
    st = client.get("/api/system/status").json()
    assert st["models"]["yolo"]["weights_exists"] is False
    r = client.put("/api/system/settings", json={"yolo_conf": 0.5})
    assert r.status_code == 200 and r.json()["yolo_conf"] == 0.5
    assert client.put("/api/system/settings", json={"yolo_conf": 5}).status_code == 422
    client.delete("/api/system/settings")


def test_validate_upload():
    with pytest.raises(UnsupportedImageError):
        validate_upload("x.gif", "image/gif", b"123")
    with pytest.raises(ImageTooLargeError):
        validate_upload("x.jpg", "image/jpeg", b"0" * (11 * 1024 * 1024))
    validate_upload("x.webp", "image/webp", b"123")


def test_class_map():
    assert class_map.classify("Plastic bottle")["category"] == "recyclable"
    assert class_map.classify("battery")["category"] == "hazardous"
    assert class_map.classify("banana")["category"] == "organic"
    assert class_map.classify("cell phone")["category"] == "ewaste"
    assert class_map.classify("Plastic bag & wrapper")["category"] == "nonrecyclable"
    other = class_map.classify("unicorn")
    assert other["category"] == "other" and other["name"] == "Unicorn"


def test_mask_utils():
    mask = np.zeros((100, 100), dtype=bool)
    mask[20:60, 30:80] = True
    area, ratio = mask_stats(mask)
    assert area == 40 * 50 and abs(ratio - 0.2) < 1e-6
    polys = mask_to_polygons(mask)
    assert len(polys) == 1 and len(polys[0]) >= 4
