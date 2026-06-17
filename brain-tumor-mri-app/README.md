# NeuroScan — Brain Tumor MRI Classification

A premium, portfolio-grade web application that classifies brain MRI scans into
four categories — **pituitary**, **no-tumor**, **meningioma**, **glioma** — using
two real, trained deep-learning models, with Grad-CAM explainability and a
side-by-side model comparison.

> ⚠️ **Educational / demonstration only.** This is **not** a medical device and
> must never be used for diagnosis or treatment decisions.

---

## Architecture

```
┌─────────────────────────┐         HTTP / JSON          ┌──────────────────────────┐
│  Frontend (Next.js)      │  ───────────────────────▶   │  Backend (FastAPI)        │
│  App Router · TS         │   POST /predict, /compare    │  TensorFlow / Keras 3     │
│  Tailwind · Framer Motion│   GET  /samples, /metrics    │  Two real .keras models   │
│  Recharts                │  ◀───────────────────────    │  Grad-CAM (OpenCV)        │
└─────────────────────────┘     probabilities + base64    └──────────────────────────┘
        :3000              Grad-CAM overlay images               :8000
```

- **All** backend calls go through `frontend/lib/api.ts` — no hardcoded URLs in
  components. The base URL comes from `NEXT_PUBLIC_API_URL`.
- Inference is **always real** — there is no simulated/hardcoded prediction in
  the shipped app. (`components/MockDataBadge.tsx` exists only as a guardrail to
  visibly mark any temporary mock used during future development.)

### Models & preprocessing (critical)

| Model            | File                              | Input        | Preprocessing                       | Grad-CAM layer |
| ---------------- | --------------------------------- | ------------ | ----------------------------------- | -------------- |
| Custom CNN       | `best_custom_cnn.keras`           | 224×224 RGB  | **divide by 255** → `[0,1]`         | `conv2d_7`     |
| EfficientNetB3   | `best_effnet_b3_finetuned.keras`  | 224×224 RGB  | **raw `[0,255]`** (baked into model)| `top_conv`     |

The class output order is fixed and **must** match the Keras model output order
(alphabetical by training folder name): `["glioma", "meningioma", "notumor", "pituitary"]`.

---

## Project structure

```
brain-tumor-mri-app/
├── backend/
│   ├── main.py            FastAPI app + endpoints
│   ├── inference.py       model loading, preprocessing, Grad-CAM
│   ├── config.py          class names + model registry (single source of truth)
│   ├── models/            best_custom_cnn.keras, best_effnet_b3_finetuned.keras
│   ├── sample_images/     drop sample MRIs here (served by /samples)
│   ├── model_comparison.csv   (optional — drop here for the About page)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/               layout, template (transitions), page, compare, about
│   ├── components/        uploader, prediction card, charts, Grad-CAM, gallery…
│   ├── lib/               api.ts (all backend calls), types.ts, classes.ts
│   ├── tailwind.config.ts design tokens
│   └── Dockerfile
├── Skills/                non-runtime design reference docs
├── docker-compose.yml
└── README.md
```

---

## Run with Docker (recommended)

```bash
cd brain-tumor-mri-app
docker compose up --build
```

- Frontend → http://localhost:3000
- Backend (Swagger) → http://localhost:8000/docs

The backend container loads both models with a warm-up pass at startup; the
frontend waits for the backend healthcheck before starting.

---

## Run locally (development)

### Backend

```bash
cd backend
python -m venv venv
# Windows:  venv\Scripts\activate     |  macOS/Linux:  source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Open http://localhost:8000/docs to exercise `/predict` and `/compare`.

> **Disk note:** TensorFlow is a large install. If your default drive is low on
> space, point pip's temp/cache elsewhere, e.g. on Windows:
> `set TMP=D:\tmp && pip install --no-cache-dir -r requirements.txt`.

### Frontend

```bash
cd frontend
npm install
# point the app at the backend (defaults to http://localhost:8000)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

Open http://localhost:3000.

---

## Adding your assets

- **Sample scans:** drop `.jpg/.png/.webp` MRI images into
  `backend/sample_images/`. They appear automatically in the dashboard gallery
  (via `GET /samples`). No code change needed.
- **Comparison metrics:** drop `model_comparison.csv` into `backend/`. The About
  page renders it live (via `GET /metrics`). Until then it shows an
  "awaiting metrics" state. Any column layout is supported (header row + rows).

---

## API reference

| Method | Path                | Purpose                                          |
| ------ | ------------------- | ------------------------------------------------ |
| GET    | `/health`           | Service + model-readiness, TF/Keras versions     |
| GET    | `/models`           | Model metadata (drives the selector)             |
| GET    | `/samples`          | List sample images in `sample_images/`           |
| GET    | `/samples/{file}`   | Serve a sample image                             |
| POST   | `/predict`          | `image` + `model` → top class, 4 probs, Grad-CAM |
| POST   | `/compare`          | `image` → results from **both** models           |
| GET    | `/metrics`          | Parsed `model_comparison.csv` (or `available:false`) |

---

## Extending

- **New model:** add one entry to `MODELS` in `backend/config.py`
  (`file`, `preprocess`, `last_conv_layer`, optional `nested_model`) and drop the
  `.keras` file in `backend/models/`. The selector, `/predict` and `/compare`
  pick it up automatically.
- **New page:** add a route under `frontend/app/` — it inherits the shared layout,
  disclaimer banner and route transitions.
- **Swap fonts:** change the Google Fonts `<link>` in `frontend/app/layout.tsx`
  and the `--font-heading` / `--font-body` variables in `app/globals.css`;
  components reference those variables, so nothing else changes.

---

## Deploying online

The backend (FastAPI) and frontend (Next.js) deploy as **two separate
services**. The frontend talks to the backend only through `lib/api.ts`, so the
single thing to wire up is the API URL.

### Environment variables

| Service  | Variable              | Notes                                                                 |
| -------- | --------------------- | --------------------------------------------------------------------- |
| frontend | `NEXT_PUBLIC_API_URL` | Public backend URL. **Baked in at build time** — set it before/at build (Docker `--build-arg`, or the host's build env). No hardcoded URLs exist elsewhere. |
| backend  | `CORS_ORIGINS`        | Comma-separated list of allowed frontend origins (e.g. `https://yourapp.com`). Defaults to localhost. |

A local `.env.local` (frontend) is git-ignored; don't commit real environment
values.

### Production build

`docker compose up --build` already produces a production frontend (Next.js
`standalone`) and a CPU TensorFlow backend. For split hosting, build each image
separately and set the env vars above.

### Security notes

- **CORS** is restricted to `CORS_ORIGINS` — set it to your real origin(s) only.
- **Uploads** are validated by content-type (`ALLOWED_CONTENT_TYPES`) and by the
  non-MRI input guardrail. Recommended hardening before public traffic: add a
  **max upload size** and basic **rate limiting** at the API or a proxy/CDN, and
  serve everything over **HTTPS**.
- The app is an **educational demo** — keep the disclaimer visible.

### Large model files (important)

The two `.keras` models total ~90 MB (and are currently committed, with
duplicate copies at the repo root). Before pushing to GitHub:

- Track models with **Git LFS** (`git lfs track "*.keras"`) — keeps the repo
  lean. (`best_effnet_b3_finetuned.keras` is ~75 MB, under GitHub's 100 MB hard
  limit, but LFS is still recommended.)
- Remove the **duplicate** root-level model copies; keep only
  `backend/models/`.

### Next.js security update

`next@15.1.6` has advisory **CVE-2025-66478**. Bumping to the latest patched
15.x is recommended (`npm i next@latest` in `frontend/`, then rebuild). Not
applied here by default.

---

## Disclaimer

This project is for **education and demonstration**. The models are not
clinically validated, were trained on a finite public dataset, and can only
distinguish among four fixed categories. Do not use it for any medical purpose.
