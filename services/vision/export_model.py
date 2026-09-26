"""One-off: download a pre-trained detector and export it to ONNX for the CPU runtime.

    pip install -r requirements-export.txt
    python export_model.py yolo11n yolo11s

Only this step needs torch/ultralytics; the service itself needs onnxruntime alone.
Licence: Ultralytics YOLO weights are AGPL-3.0 (see docs/23-camera-research.md).
"""

import shutil
import sys
from pathlib import Path

from ultralytics import YOLO

out = Path(__file__).parent / "models"
out.mkdir(exist_ok=True)
for name in sys.argv[1:] or ["yolo11n"]:
    path = YOLO(f"{name}.pt").export(format="onnx", dynamic=True, simplify=True, opset=17)
    shutil.move(path, out / f"{name}.onnx")
    Path(f"{name}.pt").unlink(missing_ok=True)
    print(out / f"{name}.onnx")
