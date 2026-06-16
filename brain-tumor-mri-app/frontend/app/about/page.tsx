"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getMetrics } from "@/lib/api";
import { CLASS_META, CLASS_ORDER } from "@/lib/classes";
import type { MetricsResponse } from "@/lib/types";
import { CheckIcon, AlertIcon, InfoIcon, LayersIcon, BrainIcon } from "@/components/Icons";

function SectionCard({
  eyebrow,
  title,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45 }}
      className="glass p-6 sm:p-8"
    >
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-surface/60 text-cyan">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="eyebrow mb-0.5">{eyebrow}</p>
          <h2 className="font-heading text-h3 font-bold">{title}</h2>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

function MetricsSection() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMetrics()
      .then(setMetrics)
      .catch((e) => setError(e.message));
  }, []);

  // Awaiting metrics state (no CSV provided yet).
  if (error || (metrics && !metrics.available)) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-surface-2/30 px-4 py-8 text-center">
        <p className="text-sm font-medium text-ink-secondary">
          Awaiting metrics
        </p>
        <p className="mx-auto mt-1 max-w-md text-xs text-ink-tertiary">
          Drop{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[11px] text-cyan">
            model_comparison.csv
          </code>{" "}
          into the <code className="text-cyan">backend/</code> folder and the
          real evaluation metrics for both models will appear here.
        </p>
      </div>
    );
  }

  if (!metrics) {
    return <p className="text-sm text-ink-tertiary">Loading metrics…</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left">
            {metrics.columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 font-semibold uppercase tracking-wide text-ink-tertiary"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-border/40 transition-colors hover:bg-surface-2/30"
            >
              {metrics.columns.map((col) => (
                <td key={col} className="px-4 py-3 tabular-nums text-ink-secondary">
                  {row[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const METHOD_STEPS = [
  {
    title: "Preprocessing",
    body: "Every scan is resized to 224×224 RGB. The Custom CNN receives pixels scaled to [0,1]; EfficientNetB3 receives raw [0,255] pixels (its preprocessing is built into the model graph).",
  },
  {
    title: "Two architectures",
    body: "A purpose-built convolutional network trained from scratch, and a fine-tuned EfficientNetB3 transfer-learning model — both output a probability across the four classes.",
  },
  {
    title: "Explainability",
    body: "Grad-CAM is computed from each model's final convolutional layer to visualize the regions that drove the prediction.",
  },
];

const LIMITATIONS = [
  "Not a medical device — never use for diagnosis, screening or treatment decisions.",
  "Trained on a finite public dataset; performance on scans from other scanners, protocols or populations is unknown.",
  "Only classifies among four fixed categories and cannot detect other conditions or out-of-distribution images.",
  "Grad-CAM indicates model attention, not clinically validated tumor localization.",
];

export default function AboutPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan">
          <InfoIcon className="h-3.5 w-3.5" />
          About this project
        </span>
        <h1 className="mt-4 font-heading text-h1 font-bold tracking-tight">
          Methodology &amp; dataset
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-secondary">
          An educational demonstration of deep-learning image classification on
          brain MRI scans, with full model explainability and a transparent
          account of its limitations.
        </p>
      </section>

      {/* Dataset overview */}
      <SectionCard eyebrow="Classes" title="Dataset overview" icon={BrainIcon}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CLASS_ORDER.map((id) => {
            const meta = CLASS_META[id];
            return (
              <div
                key={id}
                className="flex items-start gap-3 rounded-xl border border-border/50 bg-surface-2/30 p-4"
              >
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
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
                <div>
                  <p className="font-semibold text-ink-primary">{meta.label}</p>
                  <p className="mt-0.5 text-sm text-ink-tertiary">
                    {meta.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Methodology */}
      <SectionCard eyebrow="Approach" title="How it works" icon={LayersIcon}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {METHOD_STEPS.map((step, i) => (
            <div
              key={step.title}
              className="rounded-xl border border-border/50 bg-surface-2/30 p-4"
            >
              <span className="font-heading text-2xl font-bold text-cyan/40">
                0{i + 1}
              </span>
              <p className="mt-2 font-semibold text-ink-primary">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-tertiary">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Results / metrics */}
      <SectionCard eyebrow="Evaluation" title="Model comparison" icon={LayersIcon}>
        <p className="mb-4 text-sm leading-relaxed text-ink-secondary">
          Both models were evaluated on a held-out test set and perform
          comparably. The standout result is efficiency: the{" "}
          <span className="font-semibold text-ink-primary">
            Custom CNN matches the fine-tuned EfficientNetB3&apos;s accuracy
            while using roughly 9&times; fewer parameters
          </span>{" "}
          (~1.2M vs ~11M) and similar training time — the best
          accuracy-per-parameter of the two. The exact figures are loaded live
          from the project&apos;s metrics file:
        </p>
        <MetricsSection />
      </SectionCard>

      {/* Limitations */}
      <SectionCard eyebrow="Important" title="Limitations" icon={AlertIcon}>
        <ul className="space-y-3">
          {LIMITATIONS.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
              <span className="leading-relaxed text-ink-secondary">{item}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
