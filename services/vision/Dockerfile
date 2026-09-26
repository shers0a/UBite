# The vision service as it will run on the UB VM or an edge box: CPU only, no torch.
# Build after `python export_model.py` has produced models/*.onnx.
#   docker build -t ubite-vision .
#   docker run --rm --cpus=2 ubite-vision speed --imgsz 640 480 320
FROM python:3.12-slim
WORKDIR /app
# Match the CPUs the VM or container actually gets (see counter.py).
ENV VISION_THREADS=2
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY counter.py bench.py ./
COPY models/ models/
ENTRYPOINT ["python", "bench.py"]
