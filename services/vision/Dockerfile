# The vision service as it will run on the UB VM or an edge box: CPU only, no torch.
# The weights stay out of the image (and out of git): CI builds and signs it without them, and the
# models/ directory is mounted at run time, after `python export_model.py` has produced models/*.onnx.
#   docker build -t ubite-vision .
#   docker run --rm --cpus=2 -v "$PWD/models:/app/models:ro" ubite-vision speed --imgsz 640 480 320
FROM docker.io/library/python:3.12-slim
WORKDIR /app
# Match the CPUs the VM or container actually gets (see counter.py).
ENV VISION_THREADS=2
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY counter.py bench.py capture.py ./
COPY sites/ sites/
RUN mkdir -p models && useradd --system --uid 10001 --no-create-home vision
# `watch` and `site` only read the weights and post numbers: nothing here needs root.
USER vision
ENTRYPOINT ["python", "bench.py"]
