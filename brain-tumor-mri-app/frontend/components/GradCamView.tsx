"use client";

import { motion } from "framer-motion";
import { HeatIcon, InfoIcon } from "./Icons";

interface GradCamViewProps {
  originalImage: string; // base64 data URI
  gradcamImage: string | null; // base64 data URI
}

/**
 * Side-by-side original MRI and Grad-CAM heatmap. The heatmap fades in over a
 * dimmed copy of the original to reinforce that it is an overlay.
 */
export function GradCamView({ originalImage, gradcamImage }: GradCamViewProps) {
  return (
    <div className="glass p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-surface/60 text-cyan">
          <HeatIcon className="h-4 w-4" />
        </span>
        <div>
          <p className="eyebrow mb-0.5">Explainability</p>
          <h4 className="font-heading text-lg font-semibold">Grad-CAM heatmap</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
        <figure className="space-y-2">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-surface-2/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={originalImage}
              alt="Original MRI scan"
              className="aspect-square w-full object-cover"
            />
          </div>
          <figcaption className="text-center text-xs font-medium text-ink-tertiary">
            Original scan
          </figcaption>
        </figure>

        <figure className="space-y-2">
          <div className="relative overflow-hidden rounded-xl border border-border/60 bg-surface-2/40">
            {gradcamImage ? (
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                src={gradcamImage}
                alt="Grad-CAM activation heatmap overlaid on the MRI scan"
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center p-4 text-center text-xs text-ink-tertiary">
                Heatmap unavailable for this scan.
              </div>
            )}
          </div>
          <figcaption className="text-center text-xs font-medium text-ink-tertiary">
            Model attention
          </figcaption>
        </figure>
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-xl border border-border/50 bg-surface-2/30 p-3 text-xs leading-relaxed text-ink-tertiary">
        <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" aria-hidden />
        Warmer regions show where the model focused when making this prediction.
        Grad-CAM is an interpretability aid, not a clinical localization tool.
      </p>
    </div>
  );
}
