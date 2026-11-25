"""Chuyển segmentation mask (nhị phân) thành polygon và tính diện tích."""
from __future__ import annotations

import cv2
import numpy as np


def ensure_mask_shape(mask: np.ndarray, height: int, width: int) -> np.ndarray:
    mask = np.asarray(mask)
    if mask.ndim == 3:
        mask = mask[0]
    if mask.shape[:2] != (height, width):
        mask = cv2.resize(mask.astype(np.uint8), (width, height), interpolation=cv2.INTER_NEAREST)
    return mask > 0


def mask_to_polygons(mask: np.ndarray, min_area_ratio: float = 0.0005, epsilon_ratio: float = 0.002) -> list[list[list[float]]]:
    """Trả về danh sách polygon [[x, y], ...] (toạ độ pixel ảnh) của các vùng ngoài của mask."""
    m = mask.astype(np.uint8)
    contours, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    total = float(m.shape[0] * m.shape[1]) or 1.0
    polygons: list[list[list[float]]] = []
    for contour in sorted(contours, key=cv2.contourArea, reverse=True):
        area = cv2.contourArea(contour)
        if area / total < min_area_ratio:
            continue
        eps = epsilon_ratio * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, eps, True)
        if len(approx) < 3:
            continue
        polygons.append([[float(p[0][0]), float(p[0][1])] for p in approx])
    return polygons


def mask_stats(mask: np.ndarray) -> tuple[int, float]:
    """(số pixel của mask, tỷ lệ diện tích so với toàn ảnh)."""
    area = int(np.count_nonzero(mask))
    total = mask.shape[0] * mask.shape[1]
    return area, (area / total if total else 0.0)
