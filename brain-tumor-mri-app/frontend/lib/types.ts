/**
 * Shared types mirroring the FastAPI backend responses (see backend/main.py).
 * Keep these in sync with the Python schema.
 */

export type ModelKey = "custom_cnn" | "effnet_b3";

export type ClassId = "pituitary" | "notumor" | "meningioma" | "glioma";

export interface ClassProbability {
  class_id: ClassId;
  label: string;
  probability: number; // 0..1
}

export interface PredictionResult {
  model: ModelKey;
  model_label: string;
  model_subtitle: string;
  preprocess: "rescale" | "raw";
  top_class: ClassId;
  top_label: string;
  top_confidence: number; // 0..1
  is_tumor: boolean;
  probabilities: ClassProbability[];
  original_image: string; // base64 data URI
  gradcam_image: string | null; // base64 data URI
}

export interface CompareResult {
  results: PredictionResult[];
}

/**
 * Result of the lightweight non-MRI input guardrail (backend validation.py).
 * Heuristic only -- not certified medical validation.
 */
export interface ValidationInfo {
  is_valid: boolean;
  reason: string;
  message: string | null;
  confidence: number; // 0..1; for invalid = confidence it is NOT an MRI
  checks: Record<string, number>;
}

/** /predict response: either a valid prediction, or a rejected (non-MRI) image. */
export type PredictResponse =
  | ({ valid: true } & PredictionResult)
  | { valid: false; validation: ValidationInfo };

/** /compare response: either both-model results, or a rejected (non-MRI) image. */
export type CompareResponse =
  | { valid: true; results: PredictionResult[] }
  | { valid: false; validation: ValidationInfo };

export interface ModelInfo {
  key: ModelKey;
  label: string;
  subtitle: string;
  preprocess: "rescale" | "raw";
}

export interface SampleImage {
  filename: string;
  url: string; // relative to backend, e.g. /samples/foo.jpg
}

export interface HealthStatus {
  status: "ok" | "loading";
  models_loaded: string[];
  models_expected: string[];
  tensorflow_version: string;
  keras_version: string;
  classes: string[];
}

export interface MetricsResponse {
  available: boolean;
  columns: string[];
  rows: Record<string, string>[];
}
