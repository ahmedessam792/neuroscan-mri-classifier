/**
 * Single API wrapper for ALL backend calls.
 *
 * No other file in the frontend should hardcode the backend URL -- everything
 * goes through here. The base URL is read from NEXT_PUBLIC_API_URL (set in
 * .env.local for local dev, and in docker-compose for containers).
 */

import type {
  CompareResponse,
  HealthStatus,
  MetricsResponse,
  ModelInfo,
  ModelKey,
  PredictResponse,
  SampleImage,
} from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

/** Build an absolute URL to a backend resource (e.g. sample image src). */
export function backendUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

/** GET /health */
export async function getHealth(): Promise<HealthStatus> {
  const res = await fetch(backendUrl("/health"), { cache: "no-store" });
  return handle<HealthStatus>(res);
}

/** GET /models */
export async function getModels(): Promise<ModelInfo[]> {
  const res = await fetch(backendUrl("/models"), { cache: "no-store" });
  return handle<ModelInfo[]>(res);
}

/** GET /samples */
export async function getSamples(): Promise<SampleImage[]> {
  const res = await fetch(backendUrl("/samples"), { cache: "no-store" });
  return handle<SampleImage[]>(res);
}

/**
 * POST /predict (single model).
 * Returns either a valid prediction or a rejected (non-MRI) validation result
 * -- callers must branch on `valid`.
 */
export async function predict(
  file: File | Blob,
  model: ModelKey,
): Promise<PredictResponse> {
  const form = new FormData();
  form.append("image", file);
  form.append("model", model);
  const res = await fetch(backendUrl("/predict"), {
    method: "POST",
    body: form,
  });
  return handle<PredictResponse>(res);
}

/**
 * POST /compare (both models).
 * Returns either both-model results or a rejected (non-MRI) validation result
 * -- callers must branch on `valid`.
 */
export async function compare(file: File | Blob): Promise<CompareResponse> {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(backendUrl("/compare"), {
    method: "POST",
    body: form,
  });
  return handle<CompareResponse>(res);
}

/** GET /metrics (model_comparison.csv) */
export async function getMetrics(): Promise<MetricsResponse> {
  const res = await fetch(backendUrl("/metrics"), { cache: "no-store" });
  return handle<MetricsResponse>(res);
}

/** Fetch a sample image (served by backend) as a File for upload. */
export async function fetchSampleAsFile(sample: SampleImage): Promise<File> {
  const res = await fetch(backendUrl(sample.url), { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load sample ${sample.filename}`);
  const blob = await res.blob();
  return new File([blob], sample.filename, { type: blob.type });
}
