"""
FastAPI application for the Brain Tumor MRI classifier.

Endpoints
  GET  /health   -> service + model status
  GET  /samples  -> list bundled sample MRI images (reads sample_images/)
  GET  /samples/{filename} -> serve a sample image
  POST /predict  -> single-model inference (multipart: image, model)
  POST /compare  -> inference from BOTH models (multipart: image)
  GET  /metrics  -> parsed model_comparison.csv (About page)

All inference is real (see inference.py). The frontend talks to this API only
through lib/api.ts -- no URLs are hardcoded on the client.
"""

from __future__ import annotations

import csv
import os
from contextlib import asynccontextmanager

import tensorflow as tf
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

import config
import inference
import validation

# Image extensions surfaced by the /samples gallery.
SAMPLE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load both real models once, before the API starts serving traffic."""
    print("[main] Starting up -- loading models ...", flush=True)
    inference.load_models()
    print("[main] Models ready.", flush=True)
    yield
    print("[main] Shutting down.", flush=True)


app = FastAPI(
    title="Brain Tumor MRI Classification API",
    description=(
        "Educational/demonstration API serving two real Keras models "
        "(Custom CNN and fine-tuned EfficientNetB3) for brain MRI "
        "classification. NOT a diagnostic tool."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS -- allow the Next.js frontend. Override via CORS_ORIGINS (comma list).
_origins_env = os.getenv("CORS_ORIGINS")
origins = (
    [o.strip() for o in _origins_env.split(",") if o.strip()]
    if _origins_env
    else config.DEFAULT_CORS_ORIGINS
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
# Validation helpers
# --------------------------------------------------------------------------- #
async def _read_image(file: UploadFile) -> bytes:
    if file.content_type not in config.ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported image type '{file.content_type}'. "
            f"Allowed: {sorted(config.ALLOWED_CONTENT_TYPES)}",
        )
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file upload.")
    return data


# --------------------------------------------------------------------------- #
# Endpoints
# --------------------------------------------------------------------------- #
@app.get("/health")
def health():
    """Liveness + model-readiness probe."""
    return {
        "status": "ok" if inference.is_ready() else "loading",
        "models_loaded": inference.loaded_model_keys(),
        "models_expected": list(config.MODELS.keys()),
        "tensorflow_version": tf.__version__,
        "keras_version": getattr(tf.keras, "__version__", "n/a"),
        "classes": config.CLASS_NAMES,
    }


@app.get("/models")
def models():
    """Metadata for the available models (drives the model selector UI)."""
    return [
        {
            "key": key,
            "label": spec["label"],
            "subtitle": spec["subtitle"],
            "preprocess": spec["preprocess"],
        }
        for key, spec in config.MODELS.items()
    ]


@app.get("/samples")
def samples():
    """List sample MRI images found in sample_images/ (empty list if none)."""
    if not config.SAMPLES_DIR.exists():
        return []
    items = []
    for path in sorted(config.SAMPLES_DIR.iterdir()):
        if path.is_file() and path.suffix.lower() in SAMPLE_EXTS:
            items.append({"filename": path.name, "url": f"/samples/{path.name}"})
    return items


@app.get("/samples/{filename}")
def sample_file(filename: str):
    """Serve a single sample image by filename."""
    # Guard against path traversal -- only serve direct children.
    path = (config.SAMPLES_DIR / filename).resolve()
    if config.SAMPLES_DIR.resolve() not in path.parents or not path.is_file():
        raise HTTPException(status_code=404, detail="Sample not found.")
    return FileResponse(path)


@app.post("/validate")
async def validate(image: UploadFile = File(...)):
    """Run the non-MRI input guardrail only (no tumor inference).

    Useful for transparency/testing. Always returns HTTP 200.
    """
    data = await _read_image(image)
    rgb = inference.load_rgb_image(data)
    return validation.validate_mri_image(rgb)


@app.post("/predict")
async def predict(image: UploadFile = File(...), model: str = Form(config.DEFAULT_MODEL)):
    """Validate the upload, then (if valid) run a single model over it.

    Invalid (non-MRI) images return HTTP 200 with {"valid": false, ...} and NO
    tumor results -- they are never passed to the classifier.
    """
    if model not in config.MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown model '{model}'. Choose from {list(config.MODELS)}.",
        )
    if not inference.is_ready():
        raise HTTPException(status_code=503, detail="Models are still loading.")

    data = await _read_image(image)

    # Input guardrail: reject obvious non-MRI images before inference.
    rgb = inference.load_rgb_image(data)
    check = validation.validate_mri_image(rgb)
    if not check["is_valid"]:
        return {"valid": False, "validation": check}

    try:
        result = inference.predict(data, model)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}")
    return {"valid": True, **result}


@app.post("/compare")
async def compare(image: UploadFile = File(...)):
    """Validate the upload, then (if valid) run every model over it.

    Invalid (non-MRI) images return HTTP 200 with {"valid": false, ...} and NO
    tumor results.
    """
    if not inference.is_ready():
        raise HTTPException(status_code=503, detail="Models are still loading.")

    data = await _read_image(image)

    # Validate once for the single uploaded image, before any inference.
    rgb = inference.load_rgb_image(data)
    check = validation.validate_mri_image(rgb)
    if not check["is_valid"]:
        return {"valid": False, "validation": check}

    try:
        results = inference.predict_all(data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}")
    return {"valid": True, "results": results}


@app.get("/metrics")
def metrics():
    """Return parsed model_comparison.csv, or available=false when absent.

    The About page renders a clearly-marked 'awaiting metrics' state until the
    user drops a real model_comparison.csv into the backend folder.
    """
    if not config.METRICS_CSV.exists():
        return JSONResponse({"available": False, "rows": [], "columns": []})

    with config.METRICS_CSV.open(newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        rows = [dict(r) for r in reader]
        columns = reader.fieldnames or []

    return {"available": True, "columns": list(columns), "rows": rows}
