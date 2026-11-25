"""Bộ nhớ đệm ảnh (LRU) để /api/segment dùng lại ảnh vừa gửi cho /api/detect mà không phải upload lại."""
from __future__ import annotations

import threading
import uuid
from collections import OrderedDict
from typing import Optional

import numpy as np

_MAX_ITEMS = 24
_lock = threading.Lock()
_store: "OrderedDict[str, np.ndarray]" = OrderedDict()


def put(image: np.ndarray) -> str:
    image_id = uuid.uuid4().hex
    with _lock:
        _store[image_id] = image
        while len(_store) > _MAX_ITEMS:
            _store.popitem(last=False)
    return image_id


def get(image_id: str) -> Optional[np.ndarray]:
    with _lock:
        image = _store.get(image_id)
        if image is not None:
            _store.move_to_end(image_id)
        return image
