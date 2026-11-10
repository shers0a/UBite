"""Person counting for the UBite vision service.

CPU only, onnxruntime only: the same code runs on a laptop, on the UB HCI VM (no GPU) and on an
edge box beside the camera. Frames live in memory and are dropped after counting; the only
output is {timestamp, zone, person_count, confidence} (docs/07, docs/11).

Two ways to count:
- One camera, one image polygon (`Zone`, `count`): the first setup, drawn in the admin screen.
- A site (`Site`, `count_site`): several calibrated cameras and zones drawn on the floor plan of the
  hall. Heads are found on the whole frame and, where people are far and small, on tiles of the
  frame at full resolution; each head is placed on the floor plan at standing or seated head
  height; heads from different cameras that land on the same spot at the same instant are one
  person (by position only: nobody is recognised), and the zone they stand in says queue or hall.
  Sites are built from the digital twin (docs/23).
"""

from __future__ import annotations

import ast
import json
import math
import os
import time
from dataclasses import dataclass, field

import cv2
import numpy as np
import onnxruntime as ort

PERSON = 0  # COCO class id, and the person class of the canteen model
HEAD_M = 0.24  # head with hair, metres: what a head box spans


@dataclass
class Detection:
    box: tuple[float, float, float, float]  # x1, y1, x2, y2 in source pixels
    score: float
    cls: int = PERSON

    @property
    def feet(self) -> tuple[float, float]:
        """Bottom centre: where the person stands, which is what an image zone polygon describes."""
        x1, _, x2, y2 = self.box
        return (x1 + x2) / 2, y2

    @property
    def head(self) -> tuple[float, float]:
        """The centre of the head: the box centre for a head, near the top for a whole person."""
        x1, y1, x2, y2 = self.box
        return ((x1 + x2) / 2, (y1 + y2) / 2) if self.cls != PERSON else ((x1 + x2) / 2, y1 + 0.065 * (y2 - y1))


class Detector:
    """A YOLO ONNX detector. Reads both export layouts: raw anchors (1 × (4 + classes) × anchors, NMS here)
    and end-to-end (1 × N × 6: x1 y1 x2 y2 score class, YOLO26). Class names come from the model's
    metadata; a model with head classes counts heads, a COCO model counts people. The canteen model tells a
    standing head (`head`) from a seated one (`head_seated`), which fixes the height each is placed at."""

    def __init__(self, model_path: str, imgsz: int = 640, conf: float = 0.35, iou: float = 0.5,
                 threads: int | None = None):
        opts = ort.SessionOptions()
        # onnxruntime sees every host core, not a container's CPU quota; oversubscribing a 2-vCPU
        # quota with 28 threads made inference 5x slower. Set VISION_THREADS to the vCPU count.
        threads = threads or int(os.environ.get("VISION_THREADS", 0)) or None
        if threads:
            opts.intra_op_num_threads = threads
        self.session = ort.InferenceSession(model_path, opts, providers=["CPUExecutionProvider"])
        inp = self.session.get_inputs()[0]
        self.input = inp.name
        self.dynamic = not all(isinstance(d, int) for d in inp.shape[2:])
        self.imgsz, self.conf, self.iou = imgsz, conf, iou
        names = self.session.get_modelmeta().custom_metadata_map.get("names")
        self.names = ast.literal_eval(names) if names else {PERSON: "person"}
        self.head = next((k for k, v in self.names.items() if v == "head"), None)
        seated = next((k for k, v in self.names.items() if v == "head_seated"), None)
        # head classes and the posture each implies (None: unknown, decide on the floor plan)
        self.heads = {} if self.head is None else ({self.head: "standing", seated: "seated"} if seated is not None else {self.head: None})

    def _letterbox(self, frame: np.ndarray, size: int) -> tuple[np.ndarray, float, int, int]:
        h, w = frame.shape[:2]
        scale = size / max(h, w)
        nh, nw = round(h * scale), round(w * scale)
        # a model exported with dynamic shapes takes a 16:9 input padded to a multiple of 32, which costs
        # about 40% less than the square
        ch, cw = ((nh + 31) // 32 * 32, (nw + 31) // 32 * 32) if self.dynamic else (size, size)
        top, left = (ch - nh) // 2, (cw - nw) // 2
        canvas = np.full((ch, cw, 3), 114, dtype=np.uint8)
        canvas[top:top + nh, left:left + nw] = cv2.resize(frame, (nw, nh), interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_LINEAR)
        blob = cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB).transpose(2, 0, 1)[None].astype(np.float32) / 255
        return blob, scale, left, top

    def detect(self, frame: np.ndarray, imgsz: int | None = None, classes: tuple[int, ...] | None = None) -> list[Detection]:
        """Detections of the given classes (default: people, or heads and people for the canteen model)."""
        blob, scale, left, top = self._letterbox(frame, imgsz or self.imgsz)
        out = self.session.run(None, {self.input: blob})[0][0]
        if out.ndim == 2 and out.shape[1] == 6:                  # end-to-end: N × (x1 y1 x2 y2 score class)
            keep = out[:, 4] >= self.conf
            b, s, c = out[keep, :4], out[keep, 4], out[keep, 5].astype(int)
        else:                                                     # raw: (4 + classes) × anchors
            cls_scores = out[4:]
            c = cls_scores.argmax(0)
            s = cls_scores[c, np.arange(cls_scores.shape[1])]
            keep = s >= self.conf
            cx, cy, bw, bh = out[:4, keep]
            b = np.stack([cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2], 1)
            s, c = s[keep], c[keep]
            if len(s):
                xywh = np.stack([b[:, 0], b[:, 1], b[:, 2] - b[:, 0], b[:, 3] - b[:, 1]], 1)
                idx = np.array(cv2.dnn.NMSBoxesBatched(xywh.tolist(), s.tolist(), c.tolist(), self.conf, self.iou)).flatten()
                b, s, c = b[idx], s[idx], c[idx]
        wanted = classes if classes is not None else (PERSON, *self.heads)
        b = (b - [left, top, left, top]) / scale
        return [Detection(tuple(float(v) for v in b[i]), float(s[i]), int(c[i])) for i in range(len(s)) if c[i] in wanted]

    def detect_tiled(self, frame: np.ndarray, full: int, tiles: list[tuple[int, int, int, int]], tile: int = 640) -> list[Detection]:
        """The whole frame at `full` px plus each tile (x, y, w, h) at full resolution, merged: far heads are
        12–24 px in a 4 MP frame, too small once the whole frame is shrunk to 1280."""
        dets = self.detect(frame, full)
        for x, y, w, h in tiles:
            for d in self.detect(frame[y:y + h, x:x + w], tile):
                x1, y1, x2, y2 = d.box
                dets.append(Detection((x1 + x, y1 + y, x2 + x, y2 + y), d.score, d.cls))
        return merge(dets)


def merge(dets: list[Detection], iou: float = 0.55, ios: float = 0.75) -> list[Detection]:
    """Greedy, best score first, per class: drop a box that overlaps a kept one by IoU, or lies mostly inside
    it (a person cut at a tile border, seen whole by the full-frame pass)."""
    kept: list[Detection] = []
    for d in sorted(dets, key=lambda d: -d.score):
        x1, y1, x2, y2 = d.box
        a = max(0.0, x2 - x1) * max(0.0, y2 - y1)
        dup = False
        for k in kept:
            if k.cls != d.cls:
                continue
            kx1, ky1, kx2, ky2 = k.box
            iw, ih = min(x2, kx2) - max(x1, kx1), min(y2, ky2) - max(y1, ky1)
            if iw <= 0 or ih <= 0:
                continue
            inter = iw * ih
            ka = (kx2 - kx1) * (ky2 - ky1)
            if inter / (a + ka - inter) > iou or inter / max(1e-6, min(a, ka)) > ios:
                dup = True
                break
        if not dup:
            kept.append(d)
    return kept


class Zone:
    """A queue polygon in normalised image coordinates (0–1), configured once per camera position."""

    def __init__(self, name: str, points: list[tuple[float, float]] | None = None):
        self.name = name
        self.points = points or [(0, 0), (1, 0), (1, 1), (0, 1)]

    def contains(self, x: float, y: float, width: int, height: int) -> bool:
        poly = np.array([(px * width, py * height) for px, py in self.points], dtype=np.float32)
        return cv2.pointPolygonTest(poly, (float(x), float(y)), False) >= 0


def count(frame: np.ndarray, detector: Detector, zone: Zone) -> dict:
    """One observation. The frame is not kept; only this dict leaves the function."""
    h, w = frame.shape[:2]
    inside = [d for d in detector.detect(frame, classes=(PERSON,)) if zone.contains(*d.feet, w, h)]
    return {
        "timestamp": time.time(),
        "zone": zone.name,
        "person_count": len(inside),
        "confidence": round(float(np.mean([d.score for d in inside])), 3) if inside else None,
    }


# ------------------------------------------------------------------ several cameras on the floor plan
@dataclass
class Camera:
    """A calibrated camera in the hall frame (metres: x north from the entrance, y west from the east windows,
    z up). `f` is the focal length in pixels of the delivered image, `k1`/`k2` its radial distortion (OpenCV),
    `tiles` the regions (x, y, w, h) counted again at full resolution."""
    id: str
    eye: tuple[float, float, float]
    target: tuple[float, float, float]
    f: float
    size: tuple[int, int] = (2560, 1440)
    k1: float = 0.0
    k2: float = 0.0
    source: str | None = None
    tiles: list[tuple[int, int, int, int]] = field(default_factory=list)

    def __post_init__(self):
        e = np.asarray(self.eye, float)
        fw = np.asarray(self.target, float) - e
        self._e = e
        self._f = fw / np.linalg.norm(fw)
        r = np.cross(self._f, [0.0, 0.0, 1.0])
        self._r = r / np.linalg.norm(r)
        self._u = np.cross(self._r, self._f)
        w, h = self.size
        self._K = np.array([[self.f, 0, w / 2], [0, self.f, h / 2], [0, 0, 1]], float)
        self._D = np.array([self.k1, self.k2, 0, 0, 0], float)

    def to_plane(self, px: tuple[float, float], z: float) -> tuple[float, float] | None:
        """Where the ray through pixel px meets the horizontal plane at height z (None above the horizon)."""
        n = cv2.undistortPoints(np.array([[px]], float), self._K, self._D).reshape(2)
        d = self._f + self._r * n[0] - self._u * n[1]
        if d[2] >= -1e-6 or self._e[2] <= z:
            return None
        t = (z - self._e[2]) / d[2]
        p = self._e + d * t
        return float(p[0]), float(p[1])

    def distance(self, xy: tuple[float, float], z: float) -> float:
        return float(np.linalg.norm(np.array([xy[0], xy[1], z]) - self._e))


@dataclass
class FloorZone:
    """A polygon on the floor plan, owned by the camera that sees it best (its heads go first when the cameras'
    heads are fused). kind: queue or hall; posture: where people mostly stand or sit."""
    name: str
    kind: str
    posture: str
    camera: str
    polygon: list[tuple[float, float]]

    def __post_init__(self):
        self._poly = np.asarray(self.polygon, np.float32)

    def contains(self, xy: tuple[float, float]) -> bool:
        return cv2.pointPolygonTest(self._poly, (float(xy[0]), float(xy[1])), False) >= 0


class Site:
    """Cameras and floor zones from a site file (sites/*.json)."""

    def __init__(self, cfg: dict):
        self.name = cfg.get("name", "site")
        self.full = int(cfg.get("full", 1280))
        self.conf = cfg.get("conf")                      # detection threshold the site was tuned with
        self.tile = int(cfg.get("tile", 640))
        self.head_height = cfg.get("head_height", {"standing": 1.67, "seated": 1.30})
        # share of each kind's places (queue places, seats, floor) some camera sees well (1 = all of them)
        self.coverage = cfg.get("coverage", {})
        # the share of people in a kind's zones the cameras actually count (occlusion, distance), measured on the
        # twin and then on the manual counts in the canteen; the count is divided by it
        self.completeness = cfg.get("completeness", {})
        # how close two cameras' heads must be to be one person (see fuse)
        self.gate = float(cfg.get("gate", 0.45))
        self.per_metre = float(cfg.get("per_metre", 0.045))
        # queue: count only heads that were within this many metres of a head at the previous round (0: off)
        self.queue_still = float(cfg.get("queue_still", 0.8))
        self.cameras = [Camera(c["id"], tuple(c["eye"]), tuple(c["target"]), float(c["f"]), tuple(c.get("size", (2560, 1440))),
                               float(c.get("k1", 0)), float(c.get("k2", 0)), os.path.expandvars(c["source"]) if c.get("source") else None,
                               [tuple(t) for t in c.get("tiles", [])]) for c in cfg["cameras"]]
        self.zones = [FloorZone(z["name"], z["kind"], z["posture"], z["camera"], [tuple(p) for p in z["polygon"]]) for z in cfg["zones"]]

    @classmethod
    def load(cls, path: str) -> "Site":
        with open(path, encoding="utf-8") as f:
            return cls(json.load(f))

    def zone_at(self, xy: tuple[float, float]) -> FloorZone | None:
        return next((z for z in self.zones if z.contains(xy)), None)

    def locate(self, cam: Camera, d: Detection, posture: str | None = None) -> "Placed | None":
        """Where a detection's head is on the floor plan. With the posture known (the canteen model tells a
        seated head from a standing one), at that head height; otherwise at both, kept where the head's size in
        pixels best matches the size expected at that distance, with a penalty when the zone it lands in
        expects the other posture (people sit at tables and stand in the queue, mostly). None outside the
        zones: behind the counter, outside the hall, or where no camera sees well."""
        best, best_err = None, math.inf
        x1, y1, x2, y2 = d.box
        size = (y2 - y1) if d.cls != PERSON else (x2 - x1)
        metres = HEAD_M if d.cls != PERSON else 0.45          # a head, or shoulders for a whole person
        hypotheses = {posture: self.head_height[posture]} if posture else self.head_height
        for posture_h, z in hypotheses.items():
            xy = cam.to_plane(d.head, z)
            if xy is None:
                continue
            zone = self.zone_at(xy)
            if zone is None:
                continue
            dist = cam.distance(xy, z)
            err = abs(math.log(max(size, 1.0) / (cam.f * metres / dist))) + (0.0 if zone.posture == posture_h else 0.35)
            if err < best_err:
                best, best_err = Placed(cam.id, xy, zone, d.score, dist), err
        return best


@dataclass
class Placed:
    """A head on the floor plan, as one camera saw it."""
    camera: str
    xy: tuple[float, float]
    zone: FloorZone
    score: float
    dist: float                                      # metres from that camera

    @property
    def owner(self) -> bool:
        return self.zone.camera == self.camera


def fuse(points: list[Placed], gate: float = 0.45, per_metre: float = 0.045) -> list[list[Placed]]:
    """Heads seen by several cameras at the same instant, made one. Two heads from different cameras are the
    same person when they lie closer on the floor plan than both placements are uncertain: `gate` metres plus
    `per_metre` for every metre from the cameras (a far head is placed less precisely). A camera adds at most
    one head to a person, and the camera that owns the spot goes first. Position only: nobody is recognised."""
    people: list[list[Placed]] = []
    for p in sorted(points, key=lambda p: (not p.owner, -p.score)):
        best, best_d = None, math.inf
        for c in people:
            if any(q.camera == p.camera for q in c):
                continue
            q = c[0]
            dd = math.hypot(p.xy[0] - q.xy[0], p.xy[1] - q.xy[1])
            if dd < gate + per_metre * (p.dist + q.dist) / 2 and dd < best_d:
                best, best_d = c, dd
        if best is None:
            people.append([p])
        else:
            best.append(p)
    return people


MIN_COVERAGE = 0.5


def persisting(now: list[tuple[float, float]], before: list[tuple[float, float]], radius: float) -> int:
    """How many of the heads now have a head within `radius` at the previous round, one to one (closest pairs
    first): people waiting in a queue move up a place at most, people walking past it move metres. Positions
    only, kept for one round; nobody is followed."""
    pairs = sorted((math.hypot(a[0] - b[0], a[1] - b[1]), i, j) for i, a in enumerate(now) for j, b in enumerate(before))
    used_i, used_j, n = set(), set(), 0
    for d, i, j in pairs:
        if d > radius:
            break
        if i not in used_i and j not in used_j:
            used_i.add(i)
            used_j.add(j)
            n += 1
    return n


def count_site(frames: dict[str, np.ndarray], detector: Detector, site: Site, memory: dict | None = None,
               now: float | None = None) -> list[dict]:
    """One observation per zone kind (queue, hall). Every camera's heads go on the floor plan; the same person
    seen by several cameras counts once (`fuse`); each person counts in the kind of zone they stand in. Where
    the cameras see only part of a kind's places, the count is scaled up by the share seen (people are
    spread evenly enough over a hall for that), and by the site's measured completeness (the share of people
    in view the cameras count); under half seen, the kind is not reported. A kind is also
    left out when a camera that owns some of its zones has no frame: a missing count is better than a short
    one. With `memory` (a dict the caller keeps between rounds), the queue counts only the heads that were
    already there at the previous round (`persisting`), so people walking along the aisle with a tray do not
    lengthen it; the memory holds the queue's head positions of one round, nothing else."""
    return tally(*detect_site(frames, detector, site), site, memory, now)


def detect_site(frames: dict[str, np.ndarray], detector: Detector, site: Site) -> tuple[list[Placed], set[str]]:
    """Every camera's heads on the floor plan, and the zone kinds a camera without a frame leaves uncounted."""
    points: list[Placed] = []
    missing: set[str] = set()
    unit = detector.heads or {PERSON: None}
    for cam in site.cameras:
        frame = frames.get(cam.id)
        if frame is None:
            missing.update(z.kind for z in site.zones if z.camera == cam.id)
            continue
        for d in detector.detect_tiled(frame, site.full, cam.tiles, site.tile):
            if d.cls in unit and (p := site.locate(cam, d, unit[d.cls])) is not None:
                points.append(p)
    return points, missing


def tally(points: list[Placed], missing: set[str], site: Site, memory: dict | None = None, now: float | None = None) -> list[dict]:
    """The observations from one round's heads (see count_site)."""
    counts: dict[str, list[float]] = {}
    queue_xy = []
    for person in fuse(points, site.gate, site.per_metre):
        counts.setdefault(person[0].zone.kind, []).append(max(p.score for p in person))
        if person[0].zone.kind == "queue":
            queue_xy.append(person[0].xy)
    now = time.time() if now is None else now
    if memory is not None and site.queue_still > 0 and "queue" not in missing:
        before, at = memory.get("queue"), memory.get("at", -1e9)
        memory["queue"], memory["at"] = queue_xy, now
        if before is not None and now - at <= 15:
            n = persisting(queue_xy, before, site.queue_still)
            counts["queue"] = sorted(counts.get("queue", []), reverse=True)[:n]
    out = []
    for kind in sorted({z.kind for z in site.zones} - missing):
        cover = float(site.coverage.get(kind, 1.0))
        if cover < MIN_COVERAGE:
            continue
        s = counts.get(kind, [])
        scale = cover * float(site.completeness.get(kind, 1.0))
        out.append({"timestamp": now, "zone": kind, "person_count": int(round(len(s) / scale)),
                    "confidence": round(float(np.mean(s)) * min(1.0, cover), 3) if s else None})
    return out
