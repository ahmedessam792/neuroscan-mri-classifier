import type { Config } from "tailwindcss";

/**
 * Design tokens for the premium clinical dark theme.
 *
 * Colors map to CSS variables defined in app/globals.css so the palette can be
 * retuned in one place. Fonts use --font-heading / --font-body variables wired
 * by next/font in layout.tsx, so the typeface can be swapped without touching
 * any component.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces (deep navy -> slate)
        base: "rgb(var(--c-base) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--c-surface-2) / <alpha-value>)",
        border: "rgb(var(--c-border) / <alpha-value>)",

        // Text levels
        "ink-primary": "rgb(var(--c-ink-primary) / <alpha-value>)",
        "ink-secondary": "rgb(var(--c-ink-secondary) / <alpha-value>)",
        "ink-tertiary": "rgb(var(--c-ink-tertiary) / <alpha-value>)",

        // Clinical accents
        teal: "rgb(var(--c-teal) / <alpha-value>)",
        cyan: "rgb(var(--c-cyan) / <alpha-value>)",
        blue: "rgb(var(--c-blue) / <alpha-value>)",

        // Semantic
        success: "rgb(var(--c-success) / <alpha-value>)",
        warning: "rgb(var(--c-warning) / <alpha-value>)",
        danger: "rgb(var(--c-danger) / <alpha-value>)",

        // Per-class chart colors (4 tumor classes)
        "class-pituitary": "rgb(var(--c-class-pituitary) / <alpha-value>)",
        "class-notumor": "rgb(var(--c-class-notumor) / <alpha-value>)",
        "class-meningioma": "rgb(var(--c-class-meningioma) / <alpha-value>)",
        "class-glioma": "rgb(var(--c-class-glioma) / <alpha-value>)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Tightened scale for clinical hierarchy
        "display": ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "h1": ["2.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "h2": ["1.875rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "h3": ["1.375rem", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        glass: "0 8px 32px -8px rgba(2, 8, 23, 0.6)",
        "glass-lg": "0 24px 64px -16px rgba(2, 8, 23, 0.7)",
        "glow-teal": "0 0 0 1px rgb(var(--c-teal) / 0.3), 0 0 32px -4px rgb(var(--c-teal) / 0.35)",
        "glow-cyan": "0 0 0 1px rgb(var(--c-cyan) / 0.35), 0 0 40px -6px rgb(var(--c-cyan) / 0.4)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgb(var(--c-border) / 0.5) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c-border) / 0.5) 1px, transparent 1px)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
