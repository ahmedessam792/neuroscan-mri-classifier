/**
 * Per-class display metadata for the UI (labels, colors, descriptions).
 * The class ids and order mirror the backend (config.CLASS_NAMES).
 */
import type { ClassId } from "./types";

export interface ClassMeta {
  id: ClassId;
  label: string;
  short: string;
  description: string;
  isTumor: boolean;
  /** Tailwind token color name (see tailwind.config.ts) */
  colorVar: string;
  /** Hex for Recharts (cannot read CSS vars directly). */
  hex: string;
}

export const CLASS_META: Record<ClassId, ClassMeta> = {
  pituitary: {
    id: "pituitary",
    label: "Pituitary Tumor",
    short: "Pituitary",
    description: "Growth in the pituitary gland at the base of the brain.",
    isTumor: true,
    colorVar: "class-pituitary",
    hex: "#38BDF8",
  },
  notumor: {
    id: "notumor",
    label: "No Tumor",
    short: "No Tumor",
    description: "No tumor detected in the MRI scan.",
    isTumor: false,
    colorVar: "class-notumor",
    hex: "#22C55E",
  },
  meningioma: {
    id: "meningioma",
    label: "Meningioma",
    short: "Meningioma",
    description: "Tumor arising from the meninges surrounding the brain.",
    isTumor: true,
    colorVar: "class-meningioma",
    hex: "#FBBF24",
  },
  glioma: {
    id: "glioma",
    label: "Glioma",
    short: "Glioma",
    description: "Tumor originating in the glial cells of the brain.",
    isTumor: true,
    colorVar: "class-glioma",
    hex: "#FB7185",
  },
};

/**
 * Canonical class order. MUST match the backend's CLASS_NAMES, which in turn
 * matches the Keras model's output order (alphabetical by training folder name:
 * glioma, meningioma, notumor, pituitary). Used only for ordered display (e.g.
 * the About dataset table); per-prediction labels are looked up by class_id.
 */
export const CLASS_ORDER: ClassId[] = [
  "glioma",
  "meningioma",
  "notumor",
  "pituitary",
];

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}
