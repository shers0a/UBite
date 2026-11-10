"""Training capture for the head counter: keep a few of the stills the counter takes, safely, for a while.

The plan is reports/Antrenarea pe imaginile reale.md (Pasul 3). The university approved the purpose on 9 Nov 2026.

    python capture.py run    --env-file .private/cameras/nvr.env --key-file K --out D --masks sites/masks-cantina-reale.json \
                             --camera "C1=http://{UBITE_USER}:{UBITE_PASS}@{NVR_HOST}/ISAPI/Streaming/channels/101/picture" ...
    python capture.py purge  --out D                       # delete what is past its date (run also does this)
    python capture.py export --out D --key-file K --to F [--day 2026-11-10] [--camera C3] [--kept label]
    python capture.py keygen --key-file K

What `run` does, every `--every` seconds (± `--jitter`), only inside the capture hours:
- takes one still of every camera at the same moment (the counter's HTTP path, user `ubite`, live view only);
- fills the masked areas (staff behind the counter) with grey *before* anything is written;
- encrypts each still (AES-256-GCM, a key that lives outside the data folder) into a 72-hour buffer;
- deletes buffered stills older than 72 hours, every ten minutes.
Nothing else is kept: selection (`select`, nightly) moves a few stills a day out of the buffer into `kept/label`
(to label) or `kept/pool` (unlabelled pool, at most 90 days), each with a line in kept.jsonl: camera, time, reason,
deletion date. No names, nothing linked to app accounts. Camera URLs come from an env file, so no password is on
a command line or in a scheduled task.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import random
import shutil
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

import cv2
import numpy as np
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from bench import Still

MAGIC = b"UBC1"
BUFFER_HOURS = 72
DAYS = {"mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6}


LOG_FILE: str | None = None   # --log: also append every line here (pythonw has no console)


def log(**kw) -> None:
    line = json.dumps({"at": datetime.now().isoformat(timespec="seconds"), **kw}, ensure_ascii=False)
    print(line, flush=True)
    if LOG_FILE:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")


# ------------------------------------------------------------------ encryption
def load_key(path: str) -> bytes:
    key = base64.b64decode(open(path, "rb").read().strip())
    if len(key) != 32:
        sys.exit(f"{path}: not a 32-byte key (make one with: capture.py keygen --key-file {path})")
    return key


def seal(key: bytes, data: bytes, name: str) -> bytes:
    """AES-256-GCM; the file's own relative name is authenticated, so a file can't be swapped for another."""
    nonce = os.urandom(12)
    return MAGIC + nonce + AESGCM(key).encrypt(nonce, data, name.encode())


def unseal(key: bytes, blob: bytes, name: str) -> bytes:
    if blob[:4] != MAGIC:
        raise ValueError(f"{name}: not a capture file")
    return AESGCM(key).decrypt(blob[4:16], blob[16:], name.encode())


# ------------------------------------------------------------------ masks
def load_masks(path: str | None) -> dict[str, list]:
    if not path:
        return {}
    with open(path, encoding="utf-8") as f:
        return json.load(f).get("cameras", {})


def apply_masks(jpeg: bytes, polygons: list) -> bytes:
    """Grey (114, the letterbox value) over every polygon, re-encoded only when there is something to mask."""
    if not polygons:
        return jpeg
    frame = cv2.imdecode(np.frombuffer(jpeg, np.uint8), cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("not an image")
    h, w = frame.shape[:2]
    for poly in polygons:
        pts = np.array([[round(x * w), round(y * h)] for x, y in poly], np.int32)
        cv2.fillPoly(frame, [pts], (114, 114, 114))
    ok, out = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
    del frame
    if not ok:
        raise ValueError("could not re-encode")
    return out.tobytes()


# ------------------------------------------------------------------ hours
def parse_hours(spec: str) -> tuple[set[int], int, int]:
    """'mon-fri 10:55-17:20' -> (weekdays, start minute, stop minute)."""
    days, span = spec.lower().split()
    a, b = days.split("-") if "-" in days else (days, days)
    weekdays = set(range(DAYS[a], DAYS[b] + 1))
    s, e = span.split("-")
    to_min = lambda t: int(t.split(":")[0]) * 60 + int(t.split(":")[1])
    return weekdays, to_min(s), to_min(e)


def in_hours(hours: tuple[set[int], int, int], now: datetime) -> bool:
    weekdays, start, stop = hours
    m = now.hour * 60 + now.minute
    return now.weekday() in weekdays and start <= m < stop


# ------------------------------------------------------------------ files
def buffer_path(out: str, cam: str, at: datetime) -> tuple[str, str]:
    rel = f"buffer/{at:%Y-%m-%d}/{cam}/{at:%H%M%S}.jpg.enc"
    return os.path.join(out, *rel.split("/")), rel


def taken_at(rel: str) -> datetime | None:
    """The time a buffered still was taken, from its name: buffer/<day>/<cam>/<HHMMSS>.jpg.enc"""
    parts = rel.replace("\\", "/").split("/")
    try:
        return datetime.strptime(parts[-3] + parts[-1][:6], "%Y-%m-%d%H%M%S")
    except (ValueError, IndexError):
        return None


def purge(out: str, now: datetime | None = None) -> int:
    """Delete buffered stills past 72 hours, and kept ones past the date written next to them."""
    now = now or datetime.now()
    gone = 0
    root = os.path.join(out, "buffer")
    for dirpath, _, files in os.walk(root, topdown=False):
        for f in files:
            p = os.path.join(dirpath, f)
            at = taken_at(os.path.relpath(p, out))
            if at is None or now - at > timedelta(hours=BUFFER_HOURS):
                os.remove(p)
                gone += 1
        if dirpath != root and not os.listdir(dirpath):
            os.rmdir(dirpath)
    kept_log = os.path.join(out, "kept.jsonl")
    if os.path.exists(kept_log):
        rows, keep = [r for r in (json.loads(x) for x in open(kept_log, encoding="utf-8") if x.strip())], []
        for r in rows:
            if datetime.fromisoformat(r["delete_after"]) <= now:
                p = os.path.join(out, *r["file"].split("/"))
                if os.path.exists(p):
                    os.remove(p)
                    gone += 1
            else:
                keep.append(r)
        if len(keep) != len(rows):
            with open(kept_log + ".tmp", "w", encoding="utf-8") as f:
                f.writelines(json.dumps(r, ensure_ascii=False) + "\n" for r in keep)
            os.replace(kept_log + ".tmp", kept_log)
    return gone


# ------------------------------------------------------------------ commands
def read_env_file(path: str | None) -> dict[str, str]:
    env = dict(os.environ)
    if path:
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env


def stay_awake(on: bool) -> None:
    """On a Windows laptop, keep the system from sleeping while capturing (the screen may still turn off)."""
    if sys.platform == "win32":
        import ctypes
        ES_CONTINUOUS, ES_SYSTEM_REQUIRED = 0x80000000, 0x00000001
        ctypes.windll.kernel32.SetThreadExecutionState(ES_CONTINUOUS | (ES_SYSTEM_REQUIRED if on else 0))


def cmd_run(args) -> None:
    stay_awake(True)
    env = read_env_file(args.env_file)
    key = load_key(args.key_file)
    masks = load_masks(args.masks)
    cams = {}
    for spec in args.camera:
        cid, url = spec.split("=", 1)
        cams[cid] = Still(url.format(**env), cid)
    hours = parse_hours(args.hours)
    pool = ThreadPoolExecutor(max_workers=len(cams))
    stop_at = datetime.now().replace(hour=int(args.until.split(":")[0]), minute=int(args.until.split(":")[1]), second=0) if args.until else None
    log(event="start", cameras=list(cams), every=args.every, jitter=args.jitter, hours=args.hours, until=args.until,
        purged=purge(args.out))
    last_purge, kept_today, day = time.time(), {c: 0 for c in cams}, datetime.now().date()
    while True:
        now = datetime.now()
        if stop_at and now >= stop_at:
            break
        if now.date() != day:
            log(event="day", day=str(day), kept=kept_today)
            kept_today, day = {c: 0 for c in cams}, now.date()
        if time.time() - last_purge > 600:
            gone = purge(args.out)
            if gone:
                log(event="purge", deleted=gone)
            last_purge = time.time()
        if not in_hours(hours, now):
            if args.once:
                log(event="outside hours", hours=args.hours)
                break
            time.sleep(30)
            continue
        tick = time.time()
        at = datetime.now()
        stills = dict(pool.map(lambda c: (c, cams[c].fetch_jpeg(timeout=8.0)), cams))
        for cid, jpeg in stills.items():
            if jpeg is None:
                continue
            try:
                data = apply_masks(jpeg, masks.get(cid, []))
            except ValueError as e:
                log(event="skip", camera=cid, error=str(e))
                continue
            path, rel = buffer_path(args.out, cid, at)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path + ".tmp", "wb") as f:
                f.write(seal(key, data, rel))
            os.replace(path + ".tmp", path)
            kept_today[cid] += 1
        del stills
        if args.once:
            log(event="once", kept=kept_today)
            break
        wait = args.every + random.uniform(-args.jitter, args.jitter) - (time.time() - tick)
        time.sleep(max(1.0, wait))
    log(event="stop", kept=kept_today, purged=purge(args.out))
    stay_awake(False)


def cmd_purge(args) -> None:
    log(event="purge", deleted=purge(args.out))


def cmd_export(args) -> None:
    """Decrypt stills into a folder for labelling or review (on the labelling machine only)."""
    key = load_key(args.key_file)
    src = os.path.join(args.out, "kept", args.kept) if args.kept else os.path.join(args.out, "buffer")
    if args.kept and not os.path.isdir(src):
        sys.exit(f"nothing kept as {args.kept} yet")
    n = 0
    for dirpath, _, files in os.walk(src):
        for f in sorted(files):
            if not f.endswith(".enc"):
                continue
            p = os.path.join(dirpath, f)
            rel = os.path.relpath(p, args.out).replace("\\", "/")
            parts = rel.split("/")
            if args.day and args.day not in parts:
                continue
            if args.camera and args.camera not in parts:
                continue
            name = "_".join(parts[-3:]).removesuffix(".enc")
            os.makedirs(args.to, exist_ok=True)
            with open(os.path.join(args.to, name), "wb") as o:
                o.write(unseal(key, open(p, "rb").read(), rel))
            n += 1
    log(event="export", files=n, to=args.to)


# ------------------------------------------------------------------ nightly selection
# Frames kept per camera and day, by the day's split (report, "Câte cadre"): over the first window that is about
# 90/90/60 frames to label in round 0 from 5 train days (half the 180/180/120 budget; later rounds pick from the
# pool), 20 per camera from 2 validation days and 40/40/30 from 3 test days. Test and validation days keep no pool,
# so nothing from them can leak into training.
QUOTAS = {
    "train": {"label": {"C1": 18, "C2": 18, "C3": 12}, "pool": {"C1": 100, "C2": 100, "C3": 100}, "empty": 3},
    "val": {"label": {"C1": 10, "C2": 10, "C3": 10}, "pool": {}, "empty": 1},
    "test": {"label": {"C1": 14, "C2": 14, "C3": 10}, "pool": {}, "empty": 4},
}
RETENTION_DAYS = {"label": 90, "pool": 90, "empty": 90, "val": 90, "test": 180}   # DPIA: round end ≤ 90 d; test until the pilot report
MIN_GAP = {"C1": 60, "C2": 60, "C3": 20}                                        # seconds between kept frames
TILES_TOP = [(0, 0, 640, 640), (640, 0, 640, 640), (1280, 0, 640, 640)]        # the far band of the hall cameras


def phase(t: datetime) -> str:
    m = t.hour * 60 + t.minute
    return "empty" if m < 11 * 60 + 25 or m >= 17 * 60 + 5 else "open" if m < 12 * 60 + 15 else "peak" if m < 14 * 60 + 30 else "tail"


def frozen_key(gray: np.ndarray) -> str:
    """Only exact repeats (a frozen stream, a stuck buffer) share this: a 160×90 thumbnail, hashed. Near-duplicates
    are left to the time gap and k-center; a perceptual hash merged frames 5 s apart in a moving lunch crowd."""
    import hashlib
    return hashlib.sha1(cv2.resize(gray, (160, 90), interpolation=cv2.INTER_AREA).tobytes()).hexdigest()


def k_center(vectors: np.ndarray, k: int, rng: random.Random) -> list[int]:
    """Greedy k-center: each pick is the frame farthest from everything picked so far."""
    n = len(vectors)
    if k >= n:
        return list(range(n))
    picked = [rng.randrange(n)]
    dist = np.linalg.norm(vectors - vectors[picked[0]], axis=1)
    while len(picked) < k:
        i = int(dist.argmax())
        picked.append(i)
        dist = np.minimum(dist, np.linalg.norm(vectors - vectors[i], axis=1))
    return picked


def cmd_select(args) -> None:
    """Pick the frames of one day worth keeping (diversity first, 20% random), re-seal them under kept/, log them."""
    from counter import Detector
    key = load_key(args.key_file)
    day = datetime.now().strftime("%Y-%m-%d") if args.day == "today" else args.day
    split = args.split
    if args.splits and os.path.exists(args.splits):
        split = json.load(open(args.splits, encoding="utf-8")).get(day, split)
    if split == "skip":
        log(event="select", day=day, split="skip")
        return
    quotas = QUOTAS[split]
    det = Detector(args.model, imgsz=640, conf=0.25, threads=args.threads)
    rng = random.Random(day)
    kept_log = os.path.join(args.out, "kept.jsonl")
    already = set()
    if os.path.exists(kept_log):
        already = {json.loads(x)["source"] for x in open(kept_log, encoding="utf-8") if x.strip()}
    day_dir = os.path.join(args.out, "buffer", day)
    if not os.path.isdir(day_dir):
        log(event="select", day=day, split=split, error="no buffer for this day")
        return
    rows = []
    for cam in sorted(os.listdir(day_dir)):
        files = sorted(f for f in os.listdir(os.path.join(day_dir, cam)) if f.endswith(".enc"))
        cands, seen = [], set()
        for f in files:
            rel = f"buffer/{day}/{cam}/{f}"
            if rel in already:
                continue
            jpeg = unseal(key, open(os.path.join(args.out, *rel.split("/")), "rb").read(), rel)
            frame = cv2.imdecode(np.frombuffer(jpeg, np.uint8), cv2.IMREAD_COLOR)
            if frame is None:
                continue
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            h = frozen_key(gray)
            if h in seen:                                        # a frozen stream or a stuck buffer
                continue
            seen.add(h)
            at = taken_at(rel)
            heads = [d for d in det.detect_tiled(frame, 1280, [] if cam == "C3" else TILES_TOP, 640) if d.cls in det.heads]
            flipped = [d for d in det.detect_tiled(cv2.flip(frame, 1), 1280, [] if cam == "C3" else TILES_TOP, 640) if d.cls in det.heads]
            H, W = frame.shape[:2]
            grid = np.zeros((4, 8), np.float32)
            for d in heads:
                cx, cy = d.head
                grid[min(3, int(cy / H * 4)), min(7, int(cx / W * 8))] += 1
            thumb = cv2.resize(gray, (16, 9), interpolation=cv2.INTER_AREA).astype(np.float32).flatten()
            thumb = (thumb - thumb.mean()) / (thumb.std() + 1e-6)
            n = len(heads)
            cands.append({
                "rel": rel, "at": at, "jpeg": jpeg, "n": n, "phase": phase(at),
                "vec": np.concatenate([np.minimum(grid.flatten() / 4.0, 3.0), 0.25 * thumb]),
                "scores": {"heads": n, "mirror_diff": abs(n - len(flipped)),
                           "uncertain": sum(1 for d in heads if d.score < 0.5),
                           "uncertainty": round((abs(n - len(flipped)) + sum(1 for d in heads if d.score < 0.5)) / (n + 1), 3)},
            })
            del frame, gray
        # minimum time between kept frames, so neighbours in time don't fill the quota
        cands.sort(key=lambda c: c["at"])
        spaced, last = [], None
        for c in cands:
            if last is None or (c["at"] - last).total_seconds() >= MIN_GAP.get(cam, 30):
                spaced.append(c)
                last = c["at"]
        picks: dict[str, list] = {}
        # empty hall: frames with no head, before opening or after closing (negatives, not personal data)
        empties = [c for c in spaced if c["phase"] == "empty" and c["n"] == 0]
        picks["empty"] = rng.sample(empties, min(quotas["empty"], len(empties)))
        rest = [c for c in spaced if c["phase"] != "empty"]
        # label (or val/test): 20% random, the rest k-center inside strata (phase × tertile of predicted count)
        kind = "label" if split == "train" else split
        quota = quotas["label"].get(cam, 10)
        n_random = round(quota * 0.2)
        random_picks = rng.sample(rest, min(n_random, len(rest)))
        random_rels = {c["rel"] for c in random_picks}
        pool_left = [c for c in rest if c["rel"] not in random_rels]
        chosen = list(random_picks)
        if pool_left:
            terc = np.quantile([c["n"] for c in pool_left], [1 / 3, 2 / 3])
            strata: dict[tuple, list] = {}
            for c in pool_left:
                strata.setdefault((c["phase"], int(np.searchsorted(terc, c["n"], side="right"))), []).append(c)
            need = quota - len(chosen)
            sizes = {k: len(v) for k, v in strata.items()}
            total = sum(sizes.values())
            alloc = {k: max(1, round(need * s / total)) for k, s in sizes.items()}
            for k, members in strata.items():
                idx = k_center(np.stack([m["vec"] for m in members]), min(alloc[k], len(members)), rng)
                chosen += [members[i] for i in idx]
            chosen = chosen[:quota]
        picks[kind] = chosen
        if quotas["pool"].get(cam):
            chosen_rels = {c["rel"] for c in chosen}
            others = [c for c in pool_left if c["rel"] not in chosen_rels]
            picks["pool"] = rng.sample(others, min(quotas["pool"][cam], len(others)))
        for kind, items in picks.items():
            for c in items:
                rel = f"kept/{kind}/{day}/{cam}/{os.path.basename(c['rel'])}"
                path = os.path.join(args.out, *rel.split("/"))
                os.makedirs(os.path.dirname(path), exist_ok=True)
                with open(path, "wb") as f:
                    f.write(seal(key, c["jpeg"], rel))
                rows.append({"file": rel, "source": c["rel"], "camera": cam, "taken_at": c["at"].isoformat(),
                             "kind": kind, "split": split, "phase": c["phase"],
                             "reason": "empty hall" if kind == "empty" else "random" if c["rel"] in random_rels else "diversity",
                             "scores": c["scores"],
                             "delete_after": (c["at"] + timedelta(days=RETENTION_DAYS[kind])).isoformat(timespec="seconds")})
        log(event="select", day=day, split=split, camera=cam, frames=len(files), distinct=len(cands), spaced=len(spaced),
            kept={k: len(v) for k, v in picks.items()})
        del cands
    with open(kept_log, "a", encoding="utf-8") as f:
        f.writelines(json.dumps(r, ensure_ascii=False) + "\n" for r in rows)


def cmd_keygen(args) -> None:
    if os.path.exists(args.key_file):
        sys.exit(f"{args.key_file} exists; not overwriting (that would make every capture unreadable)")
    os.makedirs(os.path.dirname(os.path.abspath(args.key_file)), exist_ok=True)
    with open(args.key_file, "wb") as f:
        f.write(base64.b64encode(AESGCM.generate_key(bit_length=256)))
    log(event="keygen", key_file=args.key_file)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    run = sub.add_parser("run")
    run.add_argument("--camera", action="append", required=True, help="ID=URL; {NAME} is filled from the env file")
    run.add_argument("--env-file")
    run.add_argument("--key-file", required=True)
    run.add_argument("--out", required=True)
    run.add_argument("--masks")
    run.add_argument("--every", type=float, default=30)
    run.add_argument("--jitter", type=float, default=10)
    run.add_argument("--hours", default="mon-fri 10:55-17:20", help="capture only then (canteen 11:30-17:00, plus empty hall)")
    run.add_argument("--until", help="HH:MM: exit then (for a scheduled task)")
    run.add_argument("--once", action="store_true", help="one round, then exit (a test)")
    pg = sub.add_parser("purge")
    pg.add_argument("--out", required=True)
    ex = sub.add_parser("export")
    ex.add_argument("--out", required=True)
    ex.add_argument("--key-file", required=True)
    ex.add_argument("--to", required=True)
    ex.add_argument("--day")
    ex.add_argument("--camera")
    ex.add_argument("--kept", choices=["label", "pool", "empty", "val", "test"])
    kg = sub.add_parser("keygen")
    kg.add_argument("--key-file", required=True)
    se = sub.add_parser("select")
    se.add_argument("--out", required=True)
    se.add_argument("--key-file", required=True)
    se.add_argument("--day", default="today", help="YYYY-MM-DD or today")
    se.add_argument("--split", default="train", choices=["train", "val", "test", "skip"])
    se.add_argument("--splits", help="JSON {day: train|val|test|skip}; overrides --split for the days it names")
    se.add_argument("--model", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "ubite-n.onnx"))
    se.add_argument("--threads", type=int, default=4)
    for s in (run, pg, ex, kg, se):
        s.add_argument("--log", help="also append the log lines to this file")
    args = p.parse_args()
    global LOG_FILE
    LOG_FILE = args.log
    {"run": cmd_run, "purge": cmd_purge, "export": cmd_export, "keygen": cmd_keygen, "select": cmd_select}[args.cmd](args)


if __name__ == "__main__":
    main()
