"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ClassId, PredictionResult } from "@/lib/types";
import { CLASS_META, formatPercent } from "@/lib/classes";
import { LayersIcon } from "./Icons";

/** One analyzed scan in the current session. */
export interface HistoryEntry {
  id: string;
  timestamp: number;
  thumbnail: string; // original_image data URI
  modelLabel: string;
  topLabel: string;
  topClass: ClassId;
  topConfidence: number;
  result: PredictionResult; // kept in memory so a click restores the full view
}

interface SessionHistoryProps {
  entries: HistoryEntry[];
  activeId?: string | null;
  onSelect: (entry: HistoryEntry) => void;
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

/**
 * In-session list of recent analyses (this browser session only). Clicking an
 * entry restores that real result into the result view. No data leaves the
 * browser; history clears on reload.
 */
export function SessionHistory({
  entries,
  activeId,
  onSelect,
}: SessionHistoryProps) {
  if (entries.length === 0) return null;

  return (
    <div className="glass p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-surface/60 text-cyan">
          <LayersIcon className="h-4 w-4" />
        </span>
        <div>
          <p className="eyebrow mb-0.5">This session</p>
          <h4 className="font-heading text-lg font-semibold">Recent scans</h4>
        </div>
      </div>

      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {entries.map((entry) => {
            const meta = CLASS_META[entry.topClass];
            const active = entry.id === activeId;
            return (
              <motion.li
                key={entry.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <button
                  type="button"
                  onClick={() => onSelect(entry)}
                  aria-current={active ? "true" : undefined}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-2.5 py-2 text-left transition-colors duration-200 ${
                    active
                      ? "border-cyan/40 bg-cyan/10"
                      : "border-border/50 bg-surface-2/30 hover:border-cyan/40 hover:bg-surface-2/50"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.thumbnail}
                    alt={`${entry.topLabel} scan thumbnail`}
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: meta.hex }}
                      />
                      <p className="truncate text-sm font-semibold text-ink-primary">
                        {entry.topLabel}
                      </p>
                    </div>
                    <p className="truncate text-xs text-ink-tertiary">
                      {entry.modelLabel} · {timeAgo(entry.timestamp)}
                    </p>
                  </div>
                  <span
                    className="shrink-0 font-heading text-sm font-bold tabular-nums"
                    style={{ color: meta.hex }}
                  >
                    {formatPercent(entry.topConfidence, 0)}
                  </span>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
