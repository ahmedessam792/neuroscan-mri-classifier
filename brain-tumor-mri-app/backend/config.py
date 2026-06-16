"""
Central configuration for the Brain Tumor MRI classification backend.

This is the single source of truth for:
  - the class label order (must match the order the models were trained on),
  - the model registry (file name, preprocessing strategy, Grad-CAM conv layer),
  - filesystem paths.

To add a new model later, add one entry to ``MODELS`` -- nothing else in the
codebase hardcodes model details.
"""

from pathlib import Path

# --------------------------------------------------------------------------- #
# Paths
# --------------------------------------------------------------------------- #
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
SAMPLES_DIR = BASE_DIR / "sample_images"
METRICS_CSV = BASE_DIR / "model_comparison.csv"

# --------------------------------------------------------------------------- #
# Classification labels
# --------------------------------------------------------------------------- #
# IMPORTANT: this order MUST match the Keras training generator / model output
# order, i.e. the index each softmax position maps to. Keras
# `image_dataset_from_directory` / `flow_from_directory` assign class indices
# ALPHABETICALLY by folder name, so the model outputs probabilities in this
# alphabetical order. CLASS_NAMES[i] must equal the label for model output
# index i -- reordering this list silently mislabels every prediction.
#   index 0 -> glioma, 1 -> meningioma, 2 -> notumor, 3 -> pituitary
CLASS_NAMES = ["glioma", "meningioma", "notumor", "pituitary"]

# Human-friendly display names + short descriptions for the UI.
# (Keyed by class id, so dict order is cosmetic; kept in CLASS_NAMES order.)
CLASS_INFO = {
    "glioma": {
        "label": "Glioma",
        "description": "Tumor originating in the glial cells of the brain.",
        "is_tumor": True,
    },
    "meningioma": {
        "label": "Meningioma",
        "description": "Tumor arising from the meninges surrounding the brain.",
        "is_tumor": True,
    },
    "notumor": {
        "label": "No Tumor",
        "description": "No tumor detected in the MRI scan.",
        "is_tumor": False,
    },
    "pituitary": {
        "label": "Pituitary Tumor",
        "description": "Growth in the pituitary gland at the base of the brain.",
        "is_tumor": True,
    },
}

# --------------------------------------------------------------------------- #
# Model registry
# --------------------------------------------------------------------------- #
# Each model declares:
#   file           -> filename inside MODELS_DIR
#   label          -> display name
#   preprocess     -> "rescale" (divide by 255) or "raw" (feed [0,255] pixels)
#   last_conv_layer-> conv layer used for Grad-CAM
#   nested_model   -> name of nested sub-model holding the conv layer, or None
#
# Preprocessing differences are CRITICAL and verified from the saved configs:
#   * custom_cnn  -> pixels scaled to [0,1]
#   * effnet_b3   -> RAW [0,255] pixels (preprocessing is baked into the model)
INPUT_SIZE = (224, 224)  # (height, width) -- both models expect 224x224 RGB

MODELS = {
    "custom_cnn": {
        "file": "best_custom_cnn.keras",
        "label": "Custom CNN",
        "subtitle": "Purpose-built convolutional network",
        "preprocess": "rescale",
        "last_conv_layer": "conv2d_7",
        "nested_model": None,
    },
    "effnet_b3": {
        "file": "best_effnet_b3_finetuned.keras",
        "label": "EfficientNetB3",
        "subtitle": "Fine-tuned transfer-learning model",
        "preprocess": "raw",
        "last_conv_layer": "top_conv",
        "nested_model": "efficientnetb3",
    },
}

DEFAULT_MODEL = "custom_cnn"

# Allowed image upload types.
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}

# --------------------------------------------------------------------------- #
# Input validation (lightweight non-MRI guardrail)
# --------------------------------------------------------------------------- #
# These thresholds drive validation.validate_mri_image(). They are deliberately
# LENIENT: a real grayscale-on-black brain MRI must pass comfortably, while
# obvious non-MRI inputs (color photos, illustrations, bright screenshots) are
# rejected. This is a heuristic guardrail, NOT certified medical validation --
# tune here if a real scan is ever wrongly rejected.
VALIDATION = {
    "max_channel_diff": 0.10,      # grayscale-ness: mean per-pixel inter-channel range (0..1)
    "max_saturation": 0.20,        # mean HSV saturation (grayscale ~ 0)
    "dark_pixel_threshold": 0.12,  # luminance below this counts as a "dark" pixel
    "min_dark_fraction": 0.06,     # MRI has a substantial dark background
    "max_corner_brightness": 0.35, # mean luminance of the 4 corner patches (MRI corners are dark)
    "min_contrast_std": 0.04,      # reject near-blank / flat images
}

# User-facing message shown when an upload is rejected as non-MRI.
INVALID_IMAGE_MESSAGE = (
    "This image does not appear to be a brain MRI scan. "
    "Please upload a valid brain MRI image."
)

# CORS origins for the frontend (overridable via env in main.py).
DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
