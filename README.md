# NeuroScan — Brain Tumor MRI Classifier

A full-stack web app that classifies brain MRI scans into four categories —
**glioma**, **meningioma**, **pituitary**, **no-tumor** — using two real trained
deep-learning models, with Grad-CAM explainability and side-by-side model
comparison.

> ⚠️ **Educational / demonstration only.** This is **not** a medical device and
> must never be used for diagnosis or treatment decisions.

## Key features
- Two real Keras models: a custom VGG-style CNN and a fine-tuned EfficientNetB3
- Grad-CAM heatmaps that show where each model "looked"
- Single-image prediction (`/predict`) and dual-model comparison (`/compare`)
- Sample-image gallery, downloadable prediction report, session history
- Non-MRI input guardrail and a visible educational disclaimer

## Tech stack
- **Frontend:** Next.js (App Router, TypeScript), Tailwind CSS, Framer Motion, Recharts
- **Backend:** FastAPI, TensorFlow / Keras 3, OpenCV (Grad-CAM)
- **Infra:** Docker / Docker Compose, Git LFS for model weights

## Run locally with Docker
```bash
git lfs install            # required so the .keras weights download, not pointers
git clone https://github.com/ahmedessam792/neuroscan-mri-classifier.git
cd neuroscan-mri-classifier/brain-tumor-mri-app
docker compose up --build
```
- Frontend → http://localhost:3000
- Backend API (Swagger) → http://localhost:8000/docs

## Model files & Git LFS
The trained weights in `brain-tumor-mri-app/backend/models/` (`best_custom_cnn.keras`
~15 MB, `best_effnet_b3_finetuned.keras` ~75 MB) are tracked with **Git LFS**.
Run `git lfs install` before cloning/pulling, otherwise those files arrive as
small text pointers and the backend won't load.

## Full documentation
See the detailed app README: [`brain-tumor-mri-app/README.md`](brain-tumor-mri-app/README.md)
— architecture, model preprocessing, API reference, local dev, and deployment.

## Disclaimer
For education and demonstration only. The models are not clinically validated,
were trained on a finite public dataset, and recognize only four fixed
categories. Do not use for any medical purpose.
