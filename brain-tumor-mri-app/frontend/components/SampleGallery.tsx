"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { SampleImage } from "@/lib/types";
import { getSamples, backendUrl } from "@/lib/api";
import { ImageIcon } from "./Icons";
import { Skeleton } from "./States";

interface SampleGalleryProps {
  /** Invoked when a sample is chosen (one-click testing). */
  onSelect: (sample: SampleImage) => void;
  disabled?: boolean;
}

/**
 * One-click sample MRI gallery. Reads /samples dynamically; renders a graceful
 * empty state when the backend's sample_images/ folder has no images yet.
 */
export function SampleGallery({ onSelect, disabled }: SampleGalleryProps) {
  const [samples, setSamples] = useState<SampleImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getSamples()
      .then((s) => active && setSamples(s))
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="glass p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-surface/60 text-cyan">
          <ImageIcon className="h-4 w-4" />
        </span>
        <div>
          <p className="eyebrow mb-0.5">Try it instantly</p>
          <h4 className="font-heading text-lg font-semibold">Sample scans</h4>
        </div>
      </div>

      {/* Loading */}
      {samples === null && !error && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-ink-tertiary">
          Could not load samples ({error}).
        </p>
      )}

      {/* Empty */}
      {samples?.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/60 bg-surface-2/30 px-4 py-8 text-center">
          <p className="text-sm font-medium text-ink-secondary">
            No sample scans available yet
          </p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-ink-tertiary">
            Add MRI images to{" "}
            <code className="rounded bg-surface px-1 py-0.5 text-[11px] text-cyan">
              backend/sample_images/
            </code>{" "}
            and they will appear here automatically.
          </p>
        </div>
      )}

      {/* Gallery */}
      {samples && samples.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {samples.map((sample, i) => (
            <motion.button
              key={sample.filename}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(sample)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -3 }}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-surface-2/40 transition-colors hover:border-cyan/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={backendUrl(sample.url)}
                alt={`Sample MRI scan ${sample.filename}`}
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-base/90 to-transparent px-2 py-1.5 text-left text-[10px] font-medium text-ink-secondary opacity-0 transition-opacity group-hover:opacity-100">
                Run prediction
              </span>
            </motion.button>
          ))}
        </div>
      )}
    </section>
  );
}
