"""
Model loading and inference for the Brain Tumor MRI classifier.

Responsibilities:
  - Load both real Keras models once, at startup, with a warm-up prediction.
  - Apply the correct, model-specific preprocessing.
  - Produce class probabilities, the top prediction, and a Grad-CAM overlay.

There is NO mock / simulated inference anywhere in this module -- every result
comes from the real models.
"""

from __future__ import annotations

import base64
import io
from typing import Dict, List, Optional

import cv2
import numpy as np
import tensorflow as tf
from PIL import Image

import config

# --------------------------------------------------------------------------- #
# Module-level model cache
# --------------------------------------------------------------------------- #
_MODELS: Dict[str, tf.keras.Model] = {}


def _resolve_conv_layer(model: tf.keras.Model, spec: dict):
    """Return the target Conv layer for Grad-CAM, handling nested sub-models."""
    if spec["nested_model"]:
        nested = model.get_layer(spec["nested_model"])
        return nested, nested.get_layer(spec["last_conv_layer"])
    return model, model.get_layer(spec["last_conv_layer"])


def load_models() -> None:
    """Load every model in the registry and run a warm-up prediction.

    Called once during FastAPI startup. Prints a summary so the Grad-CAM
    layer names (conv2d_7 / top_conv) can be confirmed in the logs.
    """
    for key, spec in config.MODELS.items():
        path = config.MODELS_DIR / spec["file"]
        if not path.exists():
            raise FileNotFoundError(f"Model file not found: {path}")

        print(f"[inference] Loading model '{key}' from {path} ...", flush=True)
        model = tf.keras.models.load_model(path, compile=False)
        _MODELS[key] = model

        # Confirm the configured Grad-CAM conv layer actually exists.
        try:
            _, conv = _resolve_conv_layer(model, spec)
            print(
                f"[inference] '{key}' Grad-CAM conv layer "
                f"'{conv.name}' OK (output {conv.output.shape}).",
                flush=True,
            )
        except Exception as exc:  # pragma: no cover - surfaced at startup
            print(
                f"[inference] WARNING: conv layer "
                f"'{spec['last_conv_layer']}' not found for '{key}': {exc}",
                flush=True,
            )

        # Warm-up: build the graph / kernels so the first real request is fast.
        h, w = config.INPUT_SIZE
        warm = np.zeros((1, h, w, 3), dtype=np.float32)
        model.predict(warm, verbose=0)
        print(f"[inference] '{key}' warmed up.", flush=True)


def is_ready() -> bool:
    """True when every registered model has been loaded."""
    return len(_MODELS) == len(config.MODELS)


def loaded_model_keys() -> List[str]:
    return list(_MODELS.keys())


# --------------------------------------------------------------------------- #
# Image helpers
# --------------------------------------------------------------------------- #
def load_rgb_image(image_bytes: bytes) -> np.ndarray:
    """Decode raw bytes into a 224x224 RGB uint8 array."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    h, w = config.INPUT_SIZE
    img = img.resize((w, h))
    return np.asarray(img, dtype=np.uint8)


def _preprocess(rgb_uint8: np.ndarray, preprocess: str) -> np.ndarray:
    """Apply the model-specific preprocessing and add the batch dimension.

    CRITICAL:
      * "rescale" -> divide by 255 (custom CNN expects [0,1])
      * "raw"     -> keep [0,255] floats (EfficientNetB3 preprocessing is
                     baked into the model graph)
    """
    arr = rgb_uint8.astype(np.float32)
    if preprocess == "rescale":
        arr = arr / 255.0
    elif preprocess == "raw":
        arr = arr  # feed raw [0,255] pixels unchanged
    else:  # pragma: no cover - guarded by config
        raise ValueError(f"Unknown preprocess strategy: {preprocess}")
    return np.expand_dims(arr, axis=0)


def _to_probabilities(raw_output: np.ndarray) -> np.ndarray:
    """Return a clean probability vector that sums to 1.

    Most classifiers already end in softmax; if the output does not look like
    a probability distribution we apply softmax defensively.
    """
    vec = np.asarray(raw_output, dtype=np.float64).reshape(-1)
    if vec.min() < 0 or not np.isclose(vec.sum(), 1.0, atol=1e-3):
        e = np.exp(vec - vec.max())
        vec = e / e.sum()
    return vec


def _encode_png(rgb_uint8: np.ndarray) -> str:
    """Encode an RGB uint8 array as a base64 PNG data URI."""
    ok, buf = cv2.imencode(".png", cv2.cvtColor(rgb_uint8, cv2.COLOR_RGB2BGR))
    if not ok:  # pragma: no cover
        raise RuntimeError("Failed to PNG-encode image")
    b64 = base64.b64encode(buf.tobytes()).decode("ascii")
    return f"data:image/png;base64,{b64}"


# --------------------------------------------------------------------------- #
# Grad-CAM
# --------------------------------------------------------------------------- #
def _grad_cam(
    model: tf.keras.Model,
    spec: dict,
    input_tensor: np.ndarray,
    class_index: int,
) -> np.ndarray:
    """Compute a normalized [0,1] Grad-CAM heatmap (Hc x Wc) for class_index.

    Two cases:

    * Flat model (custom CNN) -- a single grad model maps the input to
      (conv activations, predictions).

    * Nested model (EfficientNetB3) -- the conv layer lives inside the nested
      ``efficientnetb3`` sub-model, whose internal output tensors are NOT
      connected to the outer model's input graph (building a model across that
      boundary raises a "graph disconnected" error in Keras 3). Instead we:
        1. build a grad model WITHIN the sub-model that outputs both the conv
           activation and the sub-model's feature output (connected graph), then
        2. re-apply the outer model's remaining head layers to those features.
      The GradientTape records the whole chain, so gradients flow from the
      class score back to the conv activation correctly.
    """
    x = tf.convert_to_tensor(input_tensor)

    if spec["nested_model"] is None:
        # Flat (Sequential) model. In Keras 3 a Sequential's layer `.output`
        # tensors are only defined once the layers are called on a SYMBOLIC
        # input -- the eager warm-up does not create that graph. So we re-apply
        # the layers to a fresh symbolic Input (the same layer objects are
        # reused, so their trained weights are shared) and capture both the
        # target conv activation and the final prediction.
        inp = tf.keras.Input(shape=tuple(input_tensor.shape[1:]))
        y = inp
        conv_out_sym = None
        for layer in model.layers:
            if isinstance(layer, tf.keras.layers.InputLayer):
                continue
            y = layer(y)
            if layer.name == spec["last_conv_layer"]:
                conv_out_sym = y
        if conv_out_sym is None:
            raise ValueError(
                f"Conv layer '{spec['last_conv_layer']}' not found in model."
            )
        grad_model = tf.keras.models.Model(inp, [conv_out_sym, y])
        with tf.GradientTape() as tape:
            conv_out, predictions = grad_model(x, training=False)
            loss = predictions[:, class_index]
    else:
        sub = model.get_layer(spec["nested_model"])
        conv_layer = sub.get_layer(spec["last_conv_layer"])
        inner = tf.keras.models.Model(
            inputs=sub.inputs,
            outputs=[conv_layer.output, sub.output],
        )
        # Outer layers AFTER the nested sub-model (GAP, BN, Dropout, Dense, ...).
        head_layers = []
        seen = False
        for layer in model.layers:
            if layer is sub:
                seen = True
                continue
            if seen and not isinstance(layer, tf.keras.layers.InputLayer):
                head_layers.append(layer)

        with tf.GradientTape() as tape:
            conv_out, features = inner(x, training=False)
            h = features
            for layer in head_layers:
                h = layer(h, training=False)
            loss = h[:, class_index]

    grads = tape.gradient(loss, conv_out)            # dLoss/dConv
    pooled = tf.reduce_mean(grads, axis=(0, 1, 2))   # channel importance
    conv_out = conv_out[0]                            # (H, W, C)

    heatmap = tf.reduce_sum(conv_out * pooled, axis=-1)
    heatmap = tf.nn.relu(heatmap)
    max_val = tf.reduce_max(heatmap)
    if max_val > 0:
        heatmap = heatmap / max_val
    return heatmap.numpy()


def _overlay_heatmap(
    rgb_uint8: np.ndarray, heatmap: np.ndarray, alpha: float = 0.4
) -> np.ndarray:
    """Resize + colorize the heatmap (JET) and blend over the original image."""
    h, w = rgb_uint8.shape[:2]
    hm = cv2.resize(heatmap, (w, h))
    hm = np.uint8(255 * hm)
    colored = cv2.applyColorMap(hm, cv2.COLORMAP_JET)         # BGR
    colored = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)        # -> RGB
    blended = np.uint8(rgb_uint8 * (1 - alpha) + colored * alpha)
    return blended


# --------------------------------------------------------------------------- #
# Public prediction API
# --------------------------------------------------------------------------- #
def predict(image_bytes: bytes, model_key: str) -> dict:
    """Run real inference for a single model and return a structured result."""
    if model_key not in _MODELS:
        raise KeyError(f"Unknown or unloaded model: {model_key}")

    spec = config.MODELS[model_key]
    model = _MODELS[model_key]

    rgb = load_rgb_image(image_bytes)
    batch = _preprocess(rgb, spec["preprocess"])

    raw = model.predict(batch, verbose=0)[0]
    probs = _to_probabilities(raw)

    top_index = int(np.argmax(probs))
    top_class = config.CLASS_NAMES[top_index]

    probabilities = [
        {
            "class_id": name,
            "label": config.CLASS_INFO[name]["label"],
            "probability": float(probs[i]),
        }
        for i, name in enumerate(config.CLASS_NAMES)
    ]

    # Grad-CAM for the predicted class.
    gradcam_uri: Optional[str] = None
    try:
        heatmap = _grad_cam(model, spec, batch, top_index)
        overlay = _overlay_heatmap(rgb, heatmap)
        gradcam_uri = _encode_png(overlay)
    except Exception as exc:  # Grad-CAM failure must not break prediction
        print(f"[inference] Grad-CAM failed for '{model_key}': {exc}", flush=True)

    return {
        "model": model_key,
        "model_label": spec["label"],
        "model_subtitle": spec["subtitle"],
        "preprocess": spec["preprocess"],
        "top_class": top_class,
        "top_label": config.CLASS_INFO[top_class]["label"],
        "top_confidence": float(probs[top_index]),
        "is_tumor": config.CLASS_INFO[top_class]["is_tumor"],
        "probabilities": probabilities,
        "original_image": _encode_png(rgb),
        "gradcam_image": gradcam_uri,
    }


def predict_all(image_bytes: bytes) -> List[dict]:
    """Run inference across every loaded model (for the /compare endpoint)."""
    return [predict(image_bytes, key) for key in config.MODELS.keys()]
