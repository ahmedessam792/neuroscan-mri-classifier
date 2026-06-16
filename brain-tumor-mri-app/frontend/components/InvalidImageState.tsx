"use client";

import { motion } from "framer-motion";
import type { ValidationInfo } from "@/lib/types";
import { AlertIcon, ImageIcon, InfoIcon } from "./Icons";

interface InvalidImageStateProps {
  validation: ValidationInfo;
  /** Optional retry handler (e.g. clear the current image). */
  onRetry?: () => void;
}

/**
 * Polished state shown when the input guardrail rejects a non-MRI image.
 * No tumor results are rendered. Matches the premium dark/glass theme.
 */
export function InvalidImageState({
  validation,
  onRetry,
}: InvalidImageStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      role="alert"
      className="glass relative overflow-hidden border-warning/30 p-8 text-center"
    >
      {/* Ambient warning glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-warning/20 blur-3xl"
      />

      <div className="relative flex flex-col items-center gap-5">
        <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-warning/30 bg-warning/10 text-warning">
          <ImageIcon className="h-7 w-7" />
          <span className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-warning/40 bg-base text-warning">
            <AlertIcon className="h-4 w-4" />
          </span>
        </span>

        <div className="space-y-2">
          <h3 className="font-heading text-h3 font-bold tracking-tight">
            This image does not appear to be a brain MRI scan
          </h3>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-ink-secondary">
            Please upload a valid brain MRI image. To protect against misleading
            results, the classifier was not run on this image.
          </p>
        </div>

        {/* Technical reason */}
        <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-surface-2/40 px-4 py-2.5 text-left">
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <p className="text-xs leading-relaxed text-ink-tertiary">
            {validation.reason}
          </p>
        </div>

        {onRetry && (
          <button type="button" onClick={onRetry} className="btn-ghost mt-1">
            Upload a different image
          </button>
        )}

        <p className="max-w-sm text-[11px] leading-relaxed text-ink-tertiary">
          Note: this is a lightweight input guardrail (image heuristics), not a
          certified medical validation system.
        </p>
      </div>
    </motion.div>
  );
}
