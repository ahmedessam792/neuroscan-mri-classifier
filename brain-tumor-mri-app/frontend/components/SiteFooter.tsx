import { BrainIcon } from "./Icons";

/** Footer with project framing and a final disclaimer reminder. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-base/60">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 2xl:px-12">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal to-cyan text-base">
            <BrainIcon className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-ink-secondary">
            NeuroScan · Brain Tumor MRI Classification
          </span>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-ink-tertiary">
          Educational / portfolio demonstration built with FastAPI &amp;
          Next.js. Predictions come from real deep-learning models and are{" "}
          <span className="font-semibold text-ink-secondary">
            not clinically validated
          </span>
          .
        </p>
      </div>
    </footer>
  );
}
