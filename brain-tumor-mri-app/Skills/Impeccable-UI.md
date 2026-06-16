# Design Reference — Impeccable UI / Visual Polish

> Non-runtime documentation. Records the visual-polish principles applied to
> NeuroScan. It is **not** imported or executed by the app.

## Goal

Make the interface feel **production-grade and premium** at every state — not
just the happy path. Polish lives in transitions, empty/loading/error states,
and the small details.

## Glassmorphism, depth & elevation

- `.glass` / `.glass-2` utility classes: translucent surfaces, `backdrop-blur`,
  soft layered shadows (`shadow-glass`, `shadow-glass-lg`).
- Subtle accent **glow** (`shadow-glow-teal`, `shadow-glow-cyan`) reserved for
  key elements — primary CTA, active model pill, drag-over upload state.
- Ambient radial background glows (teal/blue) add depth without neon.
- Class-colored ambient glow behind the prediction headline for emphasis.

## Motion (Framer Motion) — calm and purposeful

| Interaction            | Animation                                            |
| ---------------------- | ---------------------------------------------------- |
| Route change           | Fade + slight slide-up via `app/template.tsx`        |
| Cards / sections enter | Staggered fade/slide on load and on-scroll reveal    |
| Upload drag-over       | Dropzone glow + icon lift (spring)                   |
| Prediction reveal      | Card scale/opacity reveal + animated confidence bar  |
| Probability chart      | Bars grow/fill on load                               |
| Grad-CAM               | Heatmap fades in over the original scan              |
| Model selector         | Shared-layout pill slides between options            |

Durations sit in the 200–900ms range; micro-interactions stay ≤300ms. All
motion is disabled under `prefers-reduced-motion`.

## Interaction details

- `cursor-pointer` on every clickable element.
- Hover feedback via **color / border / shadow** transitions (150–300ms) —
  layout-stable, no jarring scale jumps that shift surrounding content.
- Buttons disable + relabel ("Analyzing…") during async inference.
- Clear, single-purpose primary vs ghost button styles.

## State completeness

Every data view ships four states:

- **Empty** — inviting placeholder (e.g. "No scan analyzed yet").
- **Loading** — skeleton shimmer + spinner ("Analyzing scan…").
- **Error** — bordered alert panel with the backend's message.
- **Populated** — the real result.

The sample gallery and the About metrics table each degrade gracefully to a
clearly-worded empty state ("awaiting metrics", "no samples yet") rather than
breaking when their data source is absent.

## Trust & safety polish

- A persistent, non-dismissible disclaimer banner sits above all content.
- Footer reiterates the "not clinically validated" framing.
- The `MockDataBadge` guardrail guarantees any temporary mock is visibly marked
  — the shipped app uses only real model output.

## Consistency

- One container width, one radius scale, one shadow scale, one icon set.
- Tokens (color, font, spacing, shadow) are centralized so the whole product
  re-themes from `globals.css` + `tailwind.config.ts`.
