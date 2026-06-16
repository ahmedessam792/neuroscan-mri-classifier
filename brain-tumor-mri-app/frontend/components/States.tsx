"use client";

import { motion } from "framer-motion";
import { AlertIcon, ImageIcon, SpinnerIcon } from "./Icons";

/** Skeleton shimmer block. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-surface-2/50 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

/** Loading panel shown while inference is running. */
export function AnalyzingState() {
  return (
    <div className="glass flex flex-col items-center justify-center gap-4 p-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan/30 bg-cyan/10 text-cyan">
        <SpinnerIcon className="h-7 w-7" />
      </span>
      <div>
        <p className="font-heading text-lg font-semibold">Analyzing scan…</p>
        <p className="mt-1 text-sm text-ink-tertiary">
          Running real model inference and computing Grad-CAM.
        </p>
      </div>
      <div className="w-full max-w-sm space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

/** Empty state for the results area before any prediction. */
export function EmptyResults() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass flex min-h-[300px] flex-col items-center justify-center gap-4 p-10 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-surface-2/50 text-ink-tertiary">
        <ImageIcon className="h-7 w-7" />
      </span>
      <div>
        <p className="font-heading text-lg font-semibold text-ink-secondary">
          No scan analyzed yet
        </p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-ink-tertiary">
          Upload an MRI image or pick a sample to see the prediction,
          probabilities and Grad-CAM heatmap.
        </p>
      </div>
    </motion.div>
  );
}

/** Inline error panel. */
export function ErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="glass flex items-start gap-3 border-danger/30 p-5"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-danger/30 bg-danger/10 text-danger">
        <AlertIcon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-semibold text-ink-primary">Something went wrong</p>
        <p className="mt-0.5 text-sm text-ink-secondary">{message}</p>
      </div>
    </div>
  );
}
