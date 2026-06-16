"use client";

import { motion } from "framer-motion";
import type { PredictionResult } from "@/lib/types";
import { CLASS_META, formatPercent } from "@/lib/classes";
import { CheckIcon, AlertIcon } from "./Icons";

interface PredictionCardProps {
  result: PredictionResult;
  /** Compact variant for the side-by-side compare layout. */
  compact?: boolean;
}

/**
 * Headline prediction card: predicted class + confidence with a reveal
 * animation and class-colored emphasis.
 */
export function PredictionCard({ result, compact }: PredictionCardProps) {
  const meta = CLASS_META[result.top_class];
  const confidencePct = formatPercent(result.top_confidence);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative overflow-hidden p-6"
    >
      {/* Class-colored ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-25 blur-3xl"
        style={{ backgroundColor: meta.hex }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Prediction</p>
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `${meta.hex}22`,
                color: meta.hex,
                boxShadow: `inset 0 0 0 1px ${meta.hex}55`,
              }}
            >
              {meta.isTumor ? (
                <AlertIcon className="h-5 w-5" />
              ) : (
                <CheckIcon className="h-5 w-5" />
              )}
            </span>
            <h3
              className={`font-heading font-bold tracking-tight ${
                compact ? "text-2xl" : "text-3xl"
              }`}
            >
              {meta.label}
            </h3>
          </div>
          {!compact && (
            <p className="mt-2 max-w-sm text-sm text-ink-secondary">
              {meta.description}
            </p>
          )}
        </div>

        {/* Confidence dial */}
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-tertiary">
            Confidence
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-heading text-3xl font-bold tabular-nums"
            style={{ color: meta.hex }}
          >
            {confidencePct}
          </motion.p>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="relative mt-5 h-2 overflow-hidden rounded-full bg-surface-2/70">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: meta.hex }}
          initial={{ width: 0 }}
          animate={{ width: `${result.top_confidence * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
        />
      </div>
    </motion.div>
  );
}
