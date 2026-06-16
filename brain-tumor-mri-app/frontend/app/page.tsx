"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImageUploader } from "@/components/ImageUploader";
import { ModelSelector } from "@/components/ModelSelector";
import { SampleGallery } from "@/components/SampleGallery";
import { PredictionCard } from "@/components/PredictionCard";
import { ProbabilityChart } from "@/components/ProbabilityChart";
import { GradCamView } from "@/components/GradCamView";
import { AnalyzingState, EmptyResults, ErrorState } from "@/components/States";
import { InvalidImageState } from "@/components/InvalidImageState";
import { BrainIcon, SparkIcon } from "@/components/Icons";
import { predict, fetchSampleAsFile, backendUrl } from "@/lib/api";
import type {
  ModelKey,
  PredictionResult,
  SampleImage,
  ValidationInfo,
} from "@/lib/types";

export default function DashboardPage() {
  const [model, setModel] = useState<ModelKey>("custom_cnn");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [invalid, setInvalid] = useState<ValidationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runPrediction = useCallback(
    async (f: File, modelKey: ModelKey) => {
      setLoading(true);
      setError(null);
      setResult(null);
      setInvalid(null);
      try {
        // Real inference via the backend (lib/api.ts -> POST /predict).
        const res = await predict(f, modelKey);
        if (res.valid) {
          setResult(res);
        } else {
          // Non-MRI image rejected by the input guardrail -- no tumor results.
          setInvalid(res.validation);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Prediction failed.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleSelect = useCallback((f: File, url: string) => {
    setFile(f);
    setPreviewUrl(url);
    setResult(null);
    setInvalid(null);
    setError(null);
  }, []);

  const handleClear = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setInvalid(null);
    setError(null);
  }, []);

  const handleSample = useCallback(
    async (sample: SampleImage) => {
      try {
        const f = await fetchSampleAsFile(sample);
        setFile(f);
        setPreviewUrl(backendUrl(sample.url));
        await runPrediction(f, model);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load sample.");
      }
    },
    [model, runPrediction],
  );

  const handleAnalyze = useCallback(() => {
    if (file) runPrediction(file, model);
  }, [file, model, runPrediction]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-surface/40 px-6 py-10 sm:px-10 sm:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-teal/20 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-2xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan">
            <SparkIcon className="h-3.5 w-3.5" />
            Two real deep-learning models · Grad-CAM explainability
          </span>
          <h1 className="mt-5 font-heading text-h1 font-bold tracking-tight sm:text-display">
            Brain Tumor MRI
            <span className="bg-gradient-to-r from-teal to-cyan bg-clip-text text-transparent">
              {" "}
              Classification
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-secondary">
            Upload a brain MRI scan and classify it across four categories —
            glioma, meningioma, no-tumor and pituitary — with live model
            inference and visual explanations.
          </p>
        </motion.div>
      </section>

      {/* Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left: controls */}
        <div className="space-y-6 lg:col-span-2">
          <section className="glass p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-surface/60 text-cyan">
                <BrainIcon className="h-4 w-4" />
              </span>
              <div>
                <p className="eyebrow mb-0.5">Step 1 · Input</p>
                <h4 className="font-heading text-lg font-semibold">
                  Upload an MRI scan
                </h4>
              </div>
            </div>

            <ImageUploader
              onSelect={handleSelect}
              onClear={handleClear}
              previewUrl={previewUrl}
              disabled={loading}
            />

            <div className="mt-5 space-y-3">
              <p className="eyebrow">Step 2 · Model</p>
              <ModelSelector value={model} onChange={setModel} disabled={loading} />
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="btn-primary mt-5 w-full"
            >
              {loading ? "Analyzing…" : "Analyze scan"}
            </button>
          </section>

          <SampleGallery onSelect={handleSample} disabled={loading} />
        </div>

        {/* Right: results */}
        <div className="space-y-6 lg:col-span-3">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" exit={{ opacity: 0 }}>
                <AnalyzingState />
              </motion.div>
            ) : error ? (
              <motion.div key="error" exit={{ opacity: 0 }}>
                <ErrorState message={error} />
              </motion.div>
            ) : invalid ? (
              <motion.div key="invalid" exit={{ opacity: 0 }}>
                <InvalidImageState validation={invalid} onRetry={handleClear} />
              </motion.div>
            ) : result ? (
              <motion.div key="result" className="space-y-6">
                <PredictionCard result={result} />
                <ProbabilityChart
                  probabilities={result.probabilities}
                  topClass={result.top_class}
                />
                <GradCamView
                  originalImage={result.original_image}
                  gradcamImage={result.gradcam_image}
                />
              </motion.div>
            ) : (
              <motion.div key="empty" exit={{ opacity: 0 }}>
                <EmptyResults />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
