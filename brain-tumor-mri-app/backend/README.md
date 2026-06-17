---
title: NeuroScan MRI Backend
emoji: 🧠
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 8000
pinned: false
---

# NeuroScan MRI Backend — Hugging Face Space (Docker)

FastAPI + TensorFlow/Keras inference API for the **NeuroScan** brain-MRI
tumor-classification demo. It serves two real trained Keras models
(a custom CNN and a fine-tuned EfficientNetB3) with Grad-CAM explainability.

> ⚠️ **Educational / demonstration only.** This is **not** a medical device and
> must never be used for diagnosis or treatment decisions.

This Space hosts only the **backend API**. The Next.js frontend is deployed
separately (Vercel) and talks to this Space via `NEXT_PUBLIC_API_URL`.

## How it runs here

- **SDK:** Docker. The image is built from the `Dockerfile` in this repo.
- **Port:** the container runs `uvicorn` on `8000`; the `app_port: 8000` field
  in the metadata above routes Space traffic to it.
- **Startup:** both models are loaded once in the FastAPI lifespan (with a
  warm-up pass) before the API serves traffic, so the first cold start can take
  ~20–60s.

## Models & Git LFS

The trained weights live in `models/` and are tracked with **Git LFS** (see
`.gitattributes`, pattern `*.keras`):

- `best_custom_cnn.keras` (~15 MB)
- `best_effnet_b3_finetuned.keras` (~75 MB)

When pushing this Space repo, run `git lfs install` first so the weights upload
as real LFS objects. If they arrive as text pointer files, model loading fails
and `/health` will report them as not loaded.

## Configuration

| Variable           | Purpose                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| `CORS_ORIGINS`     | Comma-separated exact frontend origins (e.g. `https://your-app.vercel.app`). Defaults to localhost. |
| `CORS_ORIGIN_REGEX`| Optional regex override. Defaults to allowing `https://*.vercel.app` preview deployments. |

Set these in the Space **Settings → Variables**. No secrets are required to run
the API.

## Endpoints

| Method | Path              | Purpose                                              |
| ------ | ----------------- | ---------------------------------------------------- |
| GET    | `/health`         | Liveness + model readiness, TF/Keras versions        |
| GET    | `/models`         | Model metadata (drives the selector)                 |
| GET    | `/samples`        | List bundled sample MRI images                       |
| GET    | `/samples/{file}` | Serve a sample image                                 |
| POST   | `/predict`        | `image` + `model` → top class, 4 probs, Grad-CAM     |
| POST   | `/compare`        | `image` → results from **both** models               |
| GET    | `/metrics`        | Parsed `model_comparison.csv` (or `available:false`) |

Interactive docs: `/docs`.

## Verification

```bash
BASE=https://<user>-<space>.hf.space

# 1. health + model readiness
curl "$BASE/health"

# 2. single-model prediction
curl -F "image=@sample.jpg" -F "model=custom_cnn" "$BASE/predict"

# 3. both-model comparison
curl -F "image=@sample.jpg" "$BASE/compare"
```

`/health` should report `status: ok` with both `custom_cnn` and `effnet_b3` in
`models_loaded`.

## Disclaimer

For education and demonstration only. The models are not clinically validated,
were trained on a finite public dataset, and recognize only four fixed
categories (`glioma`, `meningioma`, `notumor`, `pituitary`). Do not use for any
medical purpose.
