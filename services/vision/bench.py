"""Measure how fast the person counter runs on this machine, and try it on a real source.

    python bench.py speed  --model models/yolo11n.onnx --imgsz 640 480 320
    python bench.py images --model models/yolo11n.onnx samples/*.jpg --draw out/
    python bench.py watch  --model models/yolo11n.onnx --source rtsp://user:pass@ip:554/stream --every 5
    python bench.py watch  --model models/yolo11n.onnx --source 0          # laptop webcam
    python bench.py watch  --model models/ubite-n.onnx --every 5 \
        --source "http://user:pass@nvr/ISAPI/Streaming/channels/301/picture?videoResolutionWidth=1920&videoResolutionHeight=1080"
    python bench.py site   --model models/ubite-n.onnx --site sites/cantina-2-camere.json --every 5 --post URL
    python bench.py speed  --model models/ubite-n.onnx --site sites/cantina-2-camere.json --frame f.jpg

`speed` is the number that decides where inference can live (laptop, UB VM, edge box); with --site it
times a whole site (every camera's full frame and tiles), which is what the service does every 5 s.
`watch` (one camera, the admin's image polygon) and `site` (several calibrated cameras, zones on the
floor plan) never write a frame anywhere: they print one JSON line per observation, and with --post
send it to the API, exactly what the production service does.

A source is an RTSP stream, a video file, a webcam index, or an http(s) still URL (a camera's or NVR's
snapshot, e.g. Hikvision ISAPI `/ISAPI/Streaming/channels/<n>01/picture`, user:password in the URL). A still
is fetched once per tick: no RTSP port to open, and no 25 fps stream to decode, which costs more CPU than
counting does.
"""

from __future__ import annotations

import argparse
import base64
import glob
import hashlib
import json
import os
import platform
import re
import statistics
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

import cv2
import numpy as np
import onnxruntime as ort

from counter import Detector, Site, Zone, count, count_site


def machine() -> dict:
    return {
        "host": platform.node(),
        "os": f"{platform.system()} {platform.release()}",
        "cpu": platform.processor() or platform.machine(),
        "logical_cpus": os.cpu_count(),
        "onnxruntime": ort.__version__,
    }


def cmd_speed(args) -> None:
    frame = cv2.imread(args.frame) if args.frame else np.random.randint(0, 255, (1080, 1920, 3), np.uint8)
    print(json.dumps(machine()))
    if args.site:
        site = Site.load(args.site)
        frame = cv2.resize(frame, tuple(site.cameras[0].size))
        frames = {c.id: frame for c in site.cameras}
        for threads in args.threads:
            det = Detector(args.model, conf=site.conf or args.conf or 0.35, threads=threads or None)
            count_site(frames, det, site)  # warm-up
            times = []
            for _ in range(max(3, args.runs // 5)):
                t = time.perf_counter()
                count_site(frames, det, site)
                times.append((time.perf_counter() - t) * 1000)
            p50 = statistics.median(times)
            print(json.dumps({"model": os.path.basename(args.model), "site": site.name, "cameras": len(site.cameras),
                              "tiles": sum(len(c.tiles) for c in site.cameras), "threads": threads or "auto",
                              "ms_per_round_p50": round(p50, 1), "ms_per_camera": round(p50 / len(site.cameras), 1)}))
        return
    for imgsz in args.imgsz:
        for threads in args.threads:
            det = Detector(args.model, imgsz=imgsz, threads=threads or None)
            for _ in range(3):
                det.detect(frame)  # warm-up
            times = []
            for _ in range(args.runs):
                t = time.perf_counter()
                det.detect(frame)
                times.append((time.perf_counter() - t) * 1000)
            p50 = statistics.median(times)
            p95 = sorted(times)[int(len(times) * 0.95) - 1]
            print(json.dumps({"model": os.path.basename(args.model), "imgsz": imgsz, "threads": threads or "auto",
                              "ms_p50": round(p50, 1), "ms_p95": round(p95, 1), "fps": round(1000 / p50, 1)}))


def cmd_images(args) -> None:
    det = Detector(args.model, imgsz=args.imgsz[0], conf=args.conf or 0.35)
    zone = Zone("queue", json.loads(args.zone) if args.zone else None)
    paths = [p for pattern in args.paths for p in glob.glob(pattern)]
    if args.draw:
        os.makedirs(args.draw, exist_ok=True)
    for path in paths:
        frame = cv2.imread(path)
        t = time.perf_counter()
        obs = count(frame, det, zone)
        obs.update(file=os.path.basename(path), ms=round((time.perf_counter() - t) * 1000, 1))
        print(json.dumps(obs))
        if args.draw:  # debugging on test images only, never on the live camera
            h, w = frame.shape[:2]
            for d in det.detect(frame):
                inside = zone.contains(*d.feet, w, h)
                x1, y1, x2, y2 = map(int, d.box)
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 200, 0) if inside else (0, 0, 220), 2)
            poly = np.array([(x * w, y * h) for x, y in zone.points], np.int32)
            cv2.polylines(frame, [poly], True, (255, 160, 0), 2)
            cv2.imwrite(os.path.join(args.draw, os.path.basename(path)), frame)


def fetch_zone(url: str) -> list | None:
    """The queue polygon the tech admin drew in the UBite admin screen (GET /api/vision/config)."""
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {os.environ.get('VISION_TOKEN', '')}"})
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return json.loads(r.read())["zones"]["queue"]
    except (OSError, KeyError, ValueError) as e:
        print(json.dumps({"timestamp": time.time(), "error": f"config fetch failed: {e}"}), flush=True)
        return None


def cmd_watch(args) -> None:
    det = Detector(args.model, imgsz=args.imgsz[0], conf=args.conf or 0.35)
    zone = Zone("queue", json.loads(args.zone) if args.zone else (fetch_zone(args.config) if args.config else None))
    config_at = time.time()

    def observe(frame: np.ndarray) -> None:
        nonlocal zone, config_at
        now = time.time()
        if args.config and now - config_at > 600:  # pick up a redrawn zone every ten minutes
            zone = Zone("queue", fetch_zone(args.config) or zone.points)
            config_at = now
        obs = count(frame, det, zone)
        obs["observed_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(obs["timestamp"]))
        print(json.dumps(obs), flush=True)
        if args.post:
            post(args.post, obs)

    if Still.handles(args.source):
        still = Still(args.source)
        while True:
            tick = time.time()
            frame = still.fetch()
            if frame is not None:
                observe(frame)
                del frame
            time.sleep(max(0.0, args.every - (time.time() - tick)))

    source = int(args.source) if args.source.isdigit() else args.source
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        sys.exit(f"Cannot open source {args.source}")
    last = 0.0
    while True:
        ok = cap.grab()  # keep draining the stream so the frame we count is current
        if not ok:
            print(json.dumps({"timestamp": time.time(), "error": "source ended or dropped"}), flush=True)
            cap.release()
            time.sleep(5)
            cap = cv2.VideoCapture(source)
            continue
        if time.time() - last < args.every:
            continue
        ok, frame = cap.retrieve()
        if not ok:
            continue
        last = time.time()
        observe(frame)
        del frame


def post(url: str, body) -> None:
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST",
                                 headers={"Content-Type": "application/json",
                                          "Authorization": f"Bearer {os.environ.get('VISION_TOKEN', '')}"})
    try:
        urllib.request.urlopen(req, timeout=5).close()
    except OSError as e:
        print(json.dumps({"timestamp": time.time(), "error": f"post failed: {e}"}), flush=True)


class Stream:
    """One camera, read on its own thread so the frame taken at each tick is current, not a buffered one."""

    def __init__(self, cid: str, source: str):
        import threading
        self.cid, self.source, self.frame, self.at = cid, source, None, 0.0
        self.lock = threading.Lock()
        threading.Thread(target=self._run, daemon=True).start()

    def _run(self) -> None:
        while True:
            cap = cv2.VideoCapture(int(self.source) if self.source.isdigit() else self.source)
            while cap.isOpened():
                ok, frame = cap.read()
                if not ok:
                    break
                with self.lock:
                    self.frame, self.at = frame, time.time()
            cap.release()
            print(json.dumps({"timestamp": time.time(), "camera": self.cid, "error": "source ended or dropped"}), flush=True)
            time.sleep(5)

    def take(self, max_age: float) -> np.ndarray | None:
        with self.lock:
            frame, at, self.frame = self.frame, self.at, None   # the counter gets it; this thread keeps nothing
        return frame if frame is not None and time.time() - at <= max_age else None


class Still:
    """A camera read as stills over HTTP: its (or its NVR's) snapshot URL, user:password in the URL, HTTP digest
    or basic auth. The digest nonce is kept, so each still is one request. A refused login pauses this camera
    for 15 minutes instead of retrying: a Hikvision NVR locks an IP out after a few failed logins, and that IP
    is the server's. Messages never show the password."""

    PAUSE_AFTER_REFUSAL = 900

    def __init__(self, url: str, cid: str | None = None):
        u = urllib.parse.urlsplit(url)
        self.user, self.password = urllib.parse.unquote(u.username or ""), urllib.parse.unquote(u.password or "")
        self.base = f"{u.scheme}://{u.hostname}" + (f":{u.port}" if u.port else "")
        self.uri = u.path + (f"?{u.query}" if u.query else "")
        self.cid = cid
        self.chal: dict | None = None
        self.nc = 0
        self.paused_until = 0.0

    @staticmethod
    def handles(source: str | None) -> bool:
        return bool(source) and source.startswith(("http://", "https://"))

    def _log(self, error: str) -> None:
        msg = {"timestamp": time.time(), "error": f"{self.base}{self.uri.split('?')[0]}: {error}"}
        if self.cid:
            msg["camera"] = self.cid
        print(json.dumps(msg), flush=True)

    def _authorization(self) -> str:
        c = self.chal
        if c["scheme"] == "basic":
            return "Basic " + base64.b64encode(f"{self.user}:{self.password}".encode()).decode()
        self.nc += 1
        nc, cnonce = f"{self.nc:08x}", os.urandom(8).hex()
        ha1 = hashlib.md5(f"{self.user}:{c['realm']}:{self.password}".encode()).hexdigest()
        ha2 = hashlib.md5(f"GET:{self.uri}".encode()).hexdigest()
        qop = "auth" if "auth" in [q.strip() for q in c.get("qop", "").split(",")] else ""
        response = hashlib.md5((f"{ha1}:{c['nonce']}:{nc}:{cnonce}:{qop}:{ha2}" if qop
                                else f"{ha1}:{c['nonce']}:{ha2}").encode()).hexdigest()
        parts = [f'username="{self.user}"', f'realm="{c["realm"]}"', f'nonce="{c["nonce"]}"', f'uri="{self.uri}"',
                 f'response="{response}"', "algorithm=MD5"]
        if qop:
            parts += [f"qop={qop}", f"nc={nc}", f'cnonce="{cnonce}"']
        if c.get("opaque"):
            parts.append(f'opaque="{c["opaque"]}"')
        return "Digest " + ", ".join(parts)

    def fetch(self, timeout: float = 10) -> np.ndarray | None:
        data = self.fetch_jpeg(timeout)
        if data is None:
            return None
        frame = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
        if frame is None:
            self._log("the answer is not an image")
        return frame

    def fetch_jpeg(self, timeout: float = 10) -> bytes | None:
        """The still as the camera encoded it (for capture: no second JPEG generation)."""
        if time.time() < self.paused_until:
            return None
        sent_auth = False
        for _ in range(3):
            req = urllib.request.Request(self.base + self.uri)
            if self.chal is not None:
                req.add_header("Authorization", self._authorization())
                sent_auth = True
            try:
                with urllib.request.urlopen(req, timeout=timeout) as r:
                    data = r.read()
            except urllib.error.HTTPError as e:
                if e.code != 401:
                    self._log(f"HTTP {e.code}")
                    return None
                header = e.headers.get("WWW-Authenticate", "")
                chal = {k.lower(): a or b for k, a, b in re.findall(r'(\w+)=(?:"([^"]*)"|([^\s,]+))', header)}
                chal["scheme"] = header.split(" ", 1)[0].lower()
                if sent_auth and chal.get("stale", "").lower() != "true":
                    self.paused_until = time.time() + self.PAUSE_AFTER_REFUSAL
                    self._log("login refused; paused for 15 minutes so the camera does not lock this IP out")
                    return None
                self.chal, self.nc = chal, 0
                continue
            except OSError as e:
                self._log(f"no answer ({type(e).__name__})")
                return None
            return data
        return None


class StillStream:
    """A site camera read as stills: fetched at the tick, so every camera's frame is of the same moment."""

    def __init__(self, cid: str, source: str):
        self.cid = cid
        self.still = Still(source, cid)

    def take(self, max_age: float) -> np.ndarray | None:
        # the canteen's NVR makes one still at a time: ~0.5 s each, ~1.2 s for three in parallel
        return self.still.fetch(timeout=8.0)


def open_stream(cid: str, source: str) -> Stream | StillStream:
    return StillStream(cid, source) if Still.handles(source) else Stream(cid, source)


def cmd_site(args) -> None:
    """Every camera of the site on the same tick: count each zone once, by the camera that owns it, and
    post the queue and hall totals. A camera without a fresh frame drops its kinds from this tick."""
    site = Site.load(args.site)
    det = Detector(args.model, conf=site.conf if site.conf is not None and args.conf is None else (args.conf or 0.35))
    streams = [open_stream(c.id, c.source) for c in site.cameras if c.source]
    pool = ThreadPoolExecutor(max_workers=max(1, len(streams)))   # stills of all cameras at the same moment
    memory: dict = {}                     # the queue's head positions of the previous round, nothing else
    while True:
        tick = time.time()
        taken = pool.map(lambda s: (s.cid, s.take(max_age=2.0)), streams)
        frames = {cid: f for cid, f in taken if f is not None}
        obs = count_site(frames, det, site, memory)
        del frames
        for o in obs:
            o["observed_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(o["timestamp"]))
            print(json.dumps(o), flush=True)
        if args.post and obs:
            post(args.post, obs)
        time.sleep(max(0.0, args.every - (time.time() - tick)))


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    for name in ("speed", "images", "watch", "site"):
        s = sub.add_parser(name)
        s.add_argument("--model", default="models/yolo11n.onnx")
        s.add_argument("--imgsz", type=int, nargs="+", default=[640])
        s.add_argument("--conf", type=float, default=None, help="detection threshold (default 0.35, or the site's)")
        s.add_argument("--zone", help='normalised polygon, e.g. "[[0.1,0.3],[0.9,0.3],[0.9,1],[0.1,1]]"')
    speed = sub.choices["speed"]
    speed.add_argument("--runs", type=int, default=30)
    speed.add_argument("--threads", type=int, nargs="+", default=[0], help="0 = VISION_THREADS, else onnxruntime chooses")
    speed.add_argument("--frame", help="an image to time on (default: random 1080p noise)")
    speed.add_argument("--site", help="time a whole site file: every camera, full frame and tiles")
    images = sub.choices["images"]
    images.add_argument("paths", nargs="+")
    images.add_argument("--draw", help="write annotated copies here (test images only)")
    watch = sub.choices["watch"]
    watch.add_argument("--source", required=True, help="RTSP/HTTP URL, video file, or webcam index")
    watch.add_argument("--every", type=float, default=5, help="seconds between observations")
    watch.add_argument("--post", help="API endpoint that receives each observation")
    watch.add_argument("--config", help="API endpoint with the zone polygon (GET /api/vision/config)")
    site = sub.choices["site"]
    site.add_argument("--site", required=True, help="site file: cameras, calibration, floor zones (sites/*.json)")
    site.add_argument("--every", type=float, default=5, help="seconds between observations")
    site.add_argument("--post", help="API endpoint that receives each tick's observations")
    args = p.parse_args()
    {"speed": cmd_speed, "images": cmd_images, "watch": cmd_watch, "site": cmd_site}[args.cmd](args)


if __name__ == "__main__":
    main()
