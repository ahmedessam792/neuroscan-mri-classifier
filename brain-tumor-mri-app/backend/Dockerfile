# Brain Tumor MRI Classification -- backend image
FROM python:3.12-slim

# System libraries required by OpenCV (headless) and Pillow.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    TF_CPP_MIN_LOG_LEVEL=2

WORKDIR /app

# Install dependencies first for better layer caching.
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Application code + models.
COPY config.py inference.py validation.py main.py ./
COPY models ./models
COPY sample_images ./sample_images
# Optional metrics CSV: the [v] glob copies it if present, no error if absent.
COPY model_comparison.cs[v] ./

EXPOSE 8000

# Single worker: the models are large and loaded once per process.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
