"use client";

import { motion } from "framer-motion";
import type { PredictionResult } from "@/lib/types";
import { CLASS_META, formatPercent } from "@/lib/classes";
import { CheckIcon, AlertIcon, InfoIcon } from "./Icons";

interface ConfidenceInsightProps {
  result: PredictionResult;
}

type BandKey = "high" | "moderate" | "low";

interface Band {
  key: BandKey;
  label: string;
  color: string; // hex for inline styling
  blurb: string;
}

/** Map a top-class probability to an interpretation band. */
function getBand(confidence: number): Band {
  if (confidence >= 0.85) {
    return {
      key: "high",
      label: "High confidence",
      color: "#22C55E",
      blurb: "The model is strongly committed to this prediction.",
    };
  }
  if (confidence >= 0.6) {
    return {
      key: "moderate",
      label: "Moderate confidence",
      color: "#F59E0B",
      blurb: "The model leans toward this prediction but with some uncertainty.",
    };
  }
  return {
    key: "low",
    label: "Low confidence",
    color: "#F43F5E",
    blurb: "The model is uncertain — interpret this result with caution.",
  };
}

// Below this top-2 gap the prediction is flagged as a close call.
const AMBIGUOUS_MARGIN = 0.15;

/**
 * Translates raw probabilities into a plain-language reading: a confidence band
 * and a top-two "margin" check that flags ambiguous (near-tie) predictions.
 * Purely interpretive of the real model output -- no new inference.
 */
export function ConfidenceInsight({ result }: ConfidenceInsightProps) {
  const band = getBand(result.top_confidence);

  // Top-2 margin from the real probability vector.
  const sorted = [...result.probabilities].sort(
    (a, b) => b.probability - a.probability,
  );
  const top = sorted[0];
  const second = sorted[1];
  const margin = top.probability - second.probability;
  const ambiguous = margin < AMBIGUOUS_MARGIN;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass p-6"
    >
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-surface/60 text-cyan">
          <InfoIcon className="h-4 w-4" />
        </span>
        <div>
          <p className="eyebrow mb-0.5">Insights</p>
          <h4 className="font-heading text-lg font-semibold">
            Confidence interpretation
          </h4>
        </div>
      </div>

      {/* Band chip */}
      <div
        className="flex items-center gap-2 rounded-xl border px-3 py-2"
        style={{
          borderColor: `${band.color}55`,
          backgroundColor: `${band.color}14`,
          color: band.color,
        }}
      >
        {band.key === "high" ? (
          <CheckIcon className="h-4 w-4" />
        ) : (
          <AlertIcon className="h-4 w-4" />
        )}
        <span className="text-sm font-semibold">{band.label}</span>
        <span className="ml-auto font-heading text-sm font-bold tabular-nums">
          {formatPercent(result.top_confidence)}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{band.blurb}</p>

      {/* Top-2 margin */}
      <div className="mt-4 rounded-xl border border-border/50 bg-surface-2/30 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-tertiary">
          Top-2 margin
        </p>
        {ambiguous ? (
          <p className="mt-1 text-sm leading-relaxed text-ink-secondary">
            <span className="font-semibold text-warning">Close call.</span>{" "}
            {CLASS_META[top.class_id].short} leads{" "}
            {CLASS_META[second.class_id].short} by only{" "}
            <span className="font-semibold tabular-nums">
              {formatPercent(margin)}
            </span>{" "}
            — the prediction is ambiguous between these two classes.
          </p>
        ) : (
          <p className="mt-1 text-sm leading-relaxed text-ink-secondary">
            {CLASS_META[top.class_id].short} leads the next class
            {" "}({CLASS_META[second.class_id].short}) by a clear{" "}
            <span className="font-semibold tabular-nums">
              {formatPercent(margin)}
            </span>
            .
          </p>
        )}
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-tertiary">
        <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" aria-hidden />
        Confidence reflects the model&apos;s own certainty, not diagnostic
        accuracy. This tool is not for clinical use.
      </p>
    </motion.div>
  );
}
