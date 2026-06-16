"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImageUploader } from "@/components/ImageUploader";
import { PredictionCard } from "@/components/PredictionCard";
import { ProbabilityChart } from "@/components/ProbabilityChart";
import { GradCamView } from "@/components/GradCamView";
import { AnalyzingState, EmptyResults, ErrorState } from "@/components/States";
import { InvalidImageState } from "@/components/InvalidImageState";
import { LayersIcon } from "@/components/Icons";
import { compare } from "@/lib/api";
import { CLASS_META, formatPercent } from "@/lib/classes";
import type { PredictionResult, ValidationInfo } from "@/lib/types";

export default function ComparePage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [results, setResults] = useState<PredictionResult[] | null>(null);
  const [invalid, setInvalid] = useState<ValidationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCompare = useCallback(async (f: File) => {
    setLoading(true);
    setError(null);
    setResults(null);
    setInvalid(null);
    try {
      // Real inference from BOTH models (lib/api.ts -> POST /compare).
      const res = await compare(f);
      if (res.valid) {
        setResults(res.results);
      } else {
        // Non-MRI image rejected by the input guardrail -- no tumor results.
        setInvalid(res.validation);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Comparison failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = useCallback(
    (f: File, url: string) => {
      setPreviewUrl(url);
      runCompare(f);
    },
    [runCompare],
  );

  const handleClear = useCallback(() => {
    setPreviewUrl(null);
    setResults(null);
    setInvalid(null);
    setError(null);
  }, []);

  // Agreement banner: do both models predict the same class?
  const agreement =
    results && results.length === 2
      ? results[0].top_class === results[1].top_class
      : null;

  return (
    <div className="space-y-8">
      {/* Header + uploader band (uses full width on large screens) */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan">
            <LayersIcon className="h-3.5 w-3.5" />
            Side-by-side comparison
          </span>
          <h1 className="mt-4 font-heading text-h1 font-bold tracking-tight">
            Compare both models
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ink-secondary">
            Run one MRI scan through the Custom CNN and the fine-tuned
            EfficientNetB3 at once, and inspect where they agree, differ and
            focus their attention.
          </p>
        </div>

        <div className="w-full">
          <ImageUploader
            onSelect={handleSelect}
            onClear={handleClear}
            previewUrl={previewUrl}
            disabled={loading}
          />
        </div>
      </div>

      {/* Results */}
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
        ) : results ? (
          <motion.div key="results" className="space-y-6">
            {/* Agreement banner */}
            {agreement !== null && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass flex items-center justify-center gap-2 p-4 text-sm font-semibold ${
                  agreement ? "text-success" : "text-warning"
                }`}
              >
                {agreement ? (
                  <>
                    Both models agree:{" "}
                    <span style={{ color: CLASS_META[results[0].top_class].hex }}>
                      {CLASS_META[results[0].top_class].label}
                    </span>
                  </>
                ) : (
                  "Models disagree on the predicted class — review both below."
                )}
              </motion.div>
            )}

            {/* Two columns */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {results.map((res) => (
                <div key={res.model} className="space-y-6">
                  <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-surface-2/40 px-5 py-3">
                    <div>
                      <p className="font-heading text-base font-bold">
                        {res.model_label}
                      </p>
                      <p className="text-xs text-ink-tertiary">
                        {res.model_subtitle}
                      </p>
                    </div>
                    <p
                      className="font-heading text-xl font-bold tabular-nums"
                      style={{ color: CLASS_META[res.top_class].hex }}
                    >
                      {formatPercent(res.top_confidence)}
                    </p>
                  </div>
                  <PredictionCard result={res} compact />
                  <ProbabilityChart
                    probabilities={res.probabilities}
                    topClass={res.top_class}
                  />
                  <GradCamView
                    originalImage={res.original_image}
                    gradcamImage={res.gradcam_image}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="empty" exit={{ opacity: 0 }}>
            <EmptyResults />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
