"""
Lightweight input validation guardrail for the Brain Tumor MRI classifier.

PURPOSE
    Reject obvious non-MRI uploads (personal photos, natural images, screenshots,
    colorful illustrations, random pictures) BEFORE running the tumor classifiers,
    so the app never presents a tumor prediction for an image that clearly is not
    a brain MRI scan.

WHAT THIS IS NOT
    This is a fast, rule-based heuristic -- NOT a certified medical validation
    system and not a trained "is this an MRI" classifier. It is tuned to be
    lenient so that genuine grayscale-on-black MRI scans pass, accepting that
    some unusual non-MRI grayscale images could slip through.

HOW IT WORKS
    Brain MRIs have two robust, scale-invariant signatures versus everyday images:
      1. Grayscale         -- R == G == B (near-zero inter-channel difference and
                              near-zero HSV saturation). Catches all colour inputs.
      2. Dark background    -- the brain sits on a large near-black field, so a
                              meaningful fraction of dark pixels and dark corners.
                              Catches grayscale non-MRIs that fill the frame.
    Plus a "has detail" check to reject blank/flat images.

    Decision: is_valid = grayscale AND has_detail AND (dark_background OR dark_corners)
"""

from __future__ import annotations

import numpy as np

import config


def _clamp01(x: float) -> float:
    return float(max(0.0, min(1.0, x)))


def validate_mri_image(rgb_uint8: np.ndarray) -> dict:
    """Heuristically decide whether an RGB image looks like a brain MRI scan.

    Args:
        rgb_uint8: H x W x 3 uint8 array (e.g. from inference.load_rgb_image).

    Returns:
        {
          "is_valid": bool,
          "reason": str,        # technical explanation
          "message": str,       # user-facing message
          "confidence": float,  # 0..1; for invalid = confidence it is NOT an MRI
          "checks": {...},      # raw feature values (rounded) for transparency
        }
    """
    cfg = config.VALIDATION
    arr = rgb_uint8.astype(np.float32) / 255.0
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]

    # --- Grayscale-ness -----------------------------------------------------
    px_max = np.max(arr, axis=-1)
    px_min = np.min(arr, axis=-1)
    px_range = px_max - px_min                      # per-pixel inter-channel range
    channel_diff = float(np.mean(px_range))         # 0 for perfect grayscale
    saturation = float(np.mean(np.where(px_max > 1e-6, px_range / (px_max + 1e-6), 0.0)))

    # --- Brightness / structure --------------------------------------------
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    mean_brightness = float(np.mean(lum))
    contrast_std = float(np.std(lum))
    dark_fraction = float(np.mean(lum < cfg["dark_pixel_threshold"]))

    h, w = lum.shape
    ch, cw = max(1, h // 5), max(1, w // 5)         # 20% corner patches
    corners = np.concatenate([
        lum[:ch, :cw].ravel(), lum[:ch, -cw:].ravel(),
        lum[-ch:, :cw].ravel(), lum[-ch:, -cw:].ravel(),
    ])
    corner_brightness = float(np.mean(corners))

    # --- Boolean criteria ---------------------------------------------------
    is_color = channel_diff > cfg["max_channel_diff"] or saturation > cfg["max_saturation"]
    is_blank = contrast_std < cfg["min_contrast_std"]
    has_dark_background = dark_fraction >= cfg["min_dark_fraction"]
    has_dark_corners = corner_brightness <= cfg["max_corner_brightness"]
    has_mri_structure = has_dark_background or has_dark_corners

    is_valid = (not is_color) and (not is_blank) and has_mri_structure

    # --- Reason (priority: colour -> blank -> no dark structure) ------------
    if is_color:
        reason = "Image appears to be in colour; brain MRI scans are grayscale."
    elif is_blank:
        reason = "Image has very little contrast/detail."
    elif not has_mri_structure:
        reason = "Image lacks the dark background typical of a brain MRI scan."
    else:
        reason = "Image looks like a grayscale brain MRI scan."

    # --- MRI-likeness score -> confidence ----------------------------------
    grayscale_score = _clamp01(
        1.0 - max(channel_diff / cfg["max_channel_diff"],
                  saturation / cfg["max_saturation"])
    )
    structure_score = _clamp01(
        max(dark_fraction / (2.0 * cfg["min_dark_fraction"]),
            1.0 - corner_brightness / cfg["max_corner_brightness"])
    )
    detail_score = _clamp01(contrast_std / (2.0 * cfg["min_contrast_std"]))
    mri_likeness = (
        0.55 * grayscale_score + 0.30 * structure_score + 0.15 * detail_score
    )
    confidence = mri_likeness if is_valid else _clamp01(1.0 - mri_likeness)

    return {
        "is_valid": is_valid,
        "reason": reason,
        "message": None if is_valid else config.INVALID_IMAGE_MESSAGE,
        "confidence": round(confidence, 4),
        "checks": {
            "channel_diff": round(channel_diff, 4),
            "saturation": round(saturation, 4),
            "dark_fraction": round(dark_fraction, 4),
            "corner_brightness": round(corner_brightness, 4),
            "contrast_std": round(contrast_std, 4),
            "mean_brightness": round(mean_brightness, 4),
            "mri_likeness": round(float(mri_likeness), 4),
        },
    }
