"""Person counting for the UBite vision service.

CPU only, onnxruntime only: the same code runs on a laptop, on the UB HCI VM (no GPU) and on an
edge box beside the camera. Frames live in memory and are dropped after counting; the only
output is {timestamp, zone, person_count, confidence} (docs/07, docs/11).
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass

import cv2
import numpy as np
import onnxruntime as ort

PERSON = 0  # COCO class id


@dataclass
class Detection:
    box: tuple[float, float, float, float]  # x1, y1, x2, y2 in source pixels
    score: float

    @property
    def feet(self) -> tuple[float, float]:
        """Bottom centre: where the person stands, which is what the zone polygon describes."""
        x1, _, x2, y2 = self.box
        return (x1 + x2) / 2, y2


class Detector:
    """A YOLO-style ONNX detector (output 1 × (4 + classes) × anchors), person class only."""

    def __init__(self, model_path: str, imgsz: int = 640, conf: float = 0.35, iou: float = 0.5,
                 threads: int | None = None):
        opts = ort.SessionOptions()
        # onnxruntime sees every host core, not a container's CPU quota; oversubscribing a 2-vCPU
        # quota with 28 threads made inference 5x slower. Set VISION_THREADS to the vCPU count.
        threads = threads or int(os.environ.get("VISION_THREADS", 0)) or None
        if threads:
            opts.intra_op_num_threads = threads
        self.session = ort.InferenceSession(model_path, opts, providers=["CPUExecutionProvider"])
        self.input = self.session.get_inputs()[0].name
        self.imgsz, self.conf, self.iou = imgsz, conf, iou

    def _letterbox(self, frame: np.ndarray) -> tuple[np.ndarray, float, int, int]:
        h, w = frame.shape[:2]
        scale = self.imgsz / max(h, w)
        nh, nw = round(h * scale), round(w * scale)
        top, left = (self.imgsz - nh) // 2, (self.imgsz - nw) // 2
        canvas = np.full((self.imgsz, self.imgsz, 3), 114, dtype=np.uint8)
        canvas[top:top + nh, left:left + nw] = cv2.resize(frame, (nw, nh), interpolation=cv2.INTER_LINEAR)
        blob = cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB).transpose(2, 0, 1)[None].astype(np.float32) / 255
        return blob, scale, left, top

    def detect(self, frame: np.ndarray) -> list[Detection]:
        blob, scale, left, top = self._letterbox(frame)
        out = self.session.run(None, {self.input: blob})[0][0]  # (4 + classes, anchors)
        scores = out[4 + PERSON]
        keep = scores >= self.conf
        if not keep.any():
            return []
        cx, cy, bw, bh = out[:4, keep]
        scores = scores[keep]
        x1 = (cx - bw / 2 - left) / scale
        y1 = (cy - bh / 2 - top) / scale
        boxes = np.stack([x1, y1, bw / scale, bh / scale], axis=1)
        idx = cv2.dnn.NMSBoxes(boxes.tolist(), scores.tolist(), self.conf, self.iou)
        return [
            Detection((float(boxes[i, 0]), float(boxes[i, 1]),
                       float(boxes[i, 0] + boxes[i, 2]), float(boxes[i, 1] + boxes[i, 3])), float(scores[i]))
            for i in np.array(idx).flatten()
        ]


class Zone:
    """A queue polygon in normalised coordinates (0–1), configured once per camera position."""

    def __init__(self, name: str, points: list[tuple[float, float]] | None = None):
        self.name = name
        self.points = points or [(0, 0), (1, 0), (1, 1), (0, 1)]

    def contains(self, x: float, y: float, width: int, height: int) -> bool:
        poly = np.array([(px * width, py * height) for px, py in self.points], dtype=np.float32)
        return cv2.pointPolygonTest(poly, (float(x), float(y)), False) >= 0


def count(frame: np.ndarray, detector: Detector, zone: Zone) -> dict:
    """One observation. The frame is not kept; only this dict leaves the function."""
    h, w = frame.shape[:2]
    inside = [d for d in detector.detect(frame) if zone.contains(*d.feet, w, h)]
    return {
        "timestamp": time.time(),
        "zone": zone.name,
        "person_count": len(inside),
        "confidence": round(float(np.mean([d.score for d in inside])), 3) if inside else None,
    }
