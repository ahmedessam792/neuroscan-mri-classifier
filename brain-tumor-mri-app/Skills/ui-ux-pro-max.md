# Design Reference — UI/UX Pro Max Principles Applied

> Non-runtime documentation. This file records the design decisions behind the
> NeuroScan interface for portfolio/documentation purposes. It is **not**
> imported or executed by the app.

## Product framing

A **premium clinical AI dashboard** — not a student demo. The visual language
borrows from medical-device software and modern analytics dashboards:
restrained, high-contrast, information-dense without clutter, and calm.

## Design system (derived via the UI/UX Pro Max design-system generator)

- **Pattern:** dashboard / workspace — controls on the left, results on the right.
- **Style:** *Accessible & Ethical* — WCAG-aware, high contrast, large readable
  text, visible focus states. Appropriate for a healthcare-adjacent product.
- **Anti-patterns explicitly avoided:** AI purple/pink gradients, neon colors,
  motion-heavy/gimmicky animation.

## Color

A deep navy → slate dark theme with clinical **teal `#0891B2`** and
**cyan `#22D3EE`** accents, plus a supporting blue. Semantic colors for
success / warning / danger, and four distinct per-class colors (sky, green,
amber, rose) chosen for separation and legibility on dark surfaces.

All colors are CSS variables (RGB channels) in `app/globals.css`, surfaced to
Tailwind in `tailwind.config.ts`, so the palette is retunable in one place.

## Typography

- **Headings:** Figtree · **Body:** Noto Sans — a healthcare-tuned pairing
  (clean, trustworthy, clinical).
- Wired as **swappable tokens**: `--font-heading` / `--font-body` are set by
  `next/font` in `layout.tsx`. Swapping typefaces touches two lines and no
  components.
- A tightened type scale (`display`, `h1`–`h3`) enforces clear
  primary/secondary/tertiary hierarchy.

## Layout & hierarchy

- Consistent `max-w-7xl` container, generous spacing, glassmorphism cards.
- Three text levels (`ink-primary/secondary/tertiary`) drive visual hierarchy.
- Floating glass navbar with edge spacing (not flush to the viewport).

## Accessibility checklist honored

- Minimum 4.5:1 text contrast on dark surfaces.
- Visible `:focus-visible` rings on all interactive elements.
- Icon-only buttons carry `aria-label`; the radio-style model selector uses
  proper `role`/`aria-checked`.
- 44px+ touch targets; `prefers-reduced-motion` disables animation globally.
- SVG icon set (`components/Icons.tsx`) — **no emojis** used as UI icons.

## Charts

Recharts horizontal bar chart for the four class probabilities — the predicted
class is emphasized via opacity, with an accessible custom tooltip and on-bar
value labels (color is never the only signal).
