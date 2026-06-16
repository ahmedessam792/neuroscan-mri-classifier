"use client";

import { motion } from "framer-motion";
import type { ModelKey } from "@/lib/types";
import { LayersIcon, SparkIcon } from "./Icons";

interface ModelOption {
  key: ModelKey;
  label: string;
  subtitle: string;
}

// Static descriptors; the live /models endpoint can override labels if needed.
const OPTIONS: ModelOption[] = [
  {
    key: "custom_cnn",
    label: "Custom CNN",
    subtitle: "Purpose-built network",
  },
  {
    key: "effnet_b3",
    label: "EfficientNetB3",
    subtitle: "Fine-tuned transfer learning",
  },
];

interface ModelSelectorProps {
  value: ModelKey;
  onChange: (model: ModelKey) => void;
  disabled?: boolean;
}

/** Segmented control to pick which model runs the prediction. */
export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Select model"
      className="grid grid-cols-2 gap-2 rounded-2xl border border-border/60 bg-surface-2/30 p-1.5"
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.key;
        const Icon = opt.key === "custom_cnn" ? LayersIcon : SparkIcon;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.key)}
            className={`relative flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
              active ? "text-ink-primary" : "text-ink-secondary hover:text-ink-primary"
            }`}
          >
            {active && (
              <motion.span
                layoutId="model-pill"
                className="absolute inset-0 rounded-xl border border-cyan/40 bg-cyan/10 shadow-glow-cyan"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span
              className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                active
                  ? "border-cyan/40 bg-cyan/15 text-cyan"
                  : "border-border/60 bg-surface/50"
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="relative z-10 flex flex-col leading-tight">
              <span className="text-sm font-semibold">{opt.label}</span>
              <span className="text-xs text-ink-tertiary">{opt.subtitle}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
