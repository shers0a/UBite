"""Measure how fast the person counter runs on this machine, and try it on a real source.

    python bench.py speed  --model models/yolo11n.onnx --imgsz 640 480 320
    python bench.py images --model models/yolo11n.onnx samples/*.jpg --draw out/
    python bench.py watch  --model models/yolo11n.onnx --source rtsp://user:pass@ip:554/stream --every 5
    python bench.py watch  --model models/yolo11n.onnx --source 0          # laptop webcam

`speed` is the number that decides where inference can live (laptop, UB VM, edge box).
`watch` never writes a frame anywhere: it prints one JSON line per observation, and with
--post it sends that line to the API, exactly what the production service will do.
"""

from __future__ import annotations

import argparse
import glob
import json
import os
import platform
import statistics
import sys
import time
import urllib.request

import cv2
import numpy as np
import onnxruntime as ort

from counter import Detector, Zone, count


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
    det = Detector(args.model, imgsz=args.imgsz[0], conf=args.conf)
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
    det = Detector(args.model, imgsz=args.imgsz[0], conf=args.conf)
    zone = Zone("queue", json.loads(args.zone) if args.zone else (fetch_zone(args.config) if args.config else None))
    config_at = time.time()
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
        if args.config and last - config_at > 600:  # pick up a redrawn zone every ten minutes
            zone = Zone("queue", fetch_zone(args.config) or zone.points)
            config_at = last
        obs = count(frame, det, zone)
        obs["observed_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(obs["timestamp"]))
        del frame
        print(json.dumps(obs), flush=True)
        if args.post:
            req = urllib.request.Request(args.post, data=json.dumps(obs).encode(), method="POST",
                                         headers={"Content-Type": "application/json",
                                                  "Authorization": f"Bearer {os.environ.get('VISION_TOKEN', '')}"})
            try:
                urllib.request.urlopen(req, timeout=5).close()
            except OSError as e:
                print(json.dumps({"timestamp": time.time(), "error": f"post failed: {e}"}), flush=True)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    for name in ("speed", "images", "watch"):
        s = sub.add_parser(name)
        s.add_argument("--model", default="models/yolo11n.onnx")
        s.add_argument("--imgsz", type=int, nargs="+", default=[640])
        s.add_argument("--conf", type=float, default=0.35)
        s.add_argument("--zone", help='normalised polygon, e.g. "[[0.1,0.3],[0.9,0.3],[0.9,1],[0.1,1]]"')
    speed = sub.choices["speed"]
    speed.add_argument("--runs", type=int, default=30)
    speed.add_argument("--threads", type=int, nargs="+", default=[0], help="0 = VISION_THREADS, else onnxruntime chooses")
    speed.add_argument("--frame", help="an image to time on (default: random 1080p noise)")
    images = sub.choices["images"]
    images.add_argument("paths", nargs="+")
    images.add_argument("--draw", help="write annotated copies here (test images only)")
    watch = sub.choices["watch"]
    watch.add_argument("--source", required=True, help="RTSP/HTTP URL, video file, or webcam index")
    watch.add_argument("--every", type=float, default=5, help="seconds between observations")
    watch.add_argument("--post", help="API endpoint that receives each observation")
    watch.add_argument("--config", help="API endpoint with the zone polygon (GET /api/vision/config)")
    args = p.parse_args()
    {"speed": cmd_speed, "images": cmd_images, "watch": cmd_watch}[args.cmd](args)


if __name__ == "__main__":
    main()
