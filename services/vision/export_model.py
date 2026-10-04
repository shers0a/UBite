"""One-off: download a pre-trained detector and export it to ONNX for the CPU runtime.

    pip install -r requirements-export.txt
    python export_model.py yolo11n yolo26n

Only this step needs torch/ultralytics; the service itself needs onnxruntime alone. Shapes are dynamic,
so the counter feeds a 16:9 frame padded to a multiple of 32 instead of a square. YOLO26 is exported
end-to-end (no NMS: it would merge people standing close in a queue).
The canteen model (person + head, trained on the digital twin) is exported by UBite-twin's
pipeline/cctv_train.py into models/ubite-n.onnx; see docs/23-camera-research.md.
Licence: Ultralytics YOLO weights are AGPL-3.0 (see docs/23-camera-research.md).
"""

import shutil
import sys
from pathlib import Path

from ultralytics import YOLO

out = Path(__file__).parent / "models"
out.mkdir(exist_ok=True)
for name in sys.argv[1:] or ["yolo26n"]:
    path = YOLO(f"{name}.pt").export(format="onnx", dynamic=True, simplify=True, opset=17, end2end=name.startswith("yolo26"))
    dst = out / (f"{name}-coco.onnx" if name.startswith("yolo26") else f"{name}.onnx")
    shutil.move(path, dst)
    Path(f"{name}.pt").unlink(missing_ok=True)
    print(dst)
