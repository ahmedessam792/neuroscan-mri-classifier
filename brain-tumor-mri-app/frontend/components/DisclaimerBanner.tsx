import { AlertIcon } from "./Icons";

/**
 * Persistent, always-visible medical disclaimer. Rendered at the very top of
 * every page (in layout.tsx) and never dismissible -- this is an educational
 * demonstration, not a diagnostic tool.
 */
export function DisclaimerBanner() {
  return (
    <div
      role="note"
      className="sticky top-0 z-50 border-b border-warning/25 bg-warning/10 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-[1600px] items-center gap-2.5 px-5 py-2 sm:px-8 lg:px-10 2xl:px-12">
        <AlertIcon className="h-4 w-4 shrink-0 text-warning" aria-hidden />
        <p className="text-[13px] leading-snug text-ink-secondary">
          <span className="font-semibold text-warning">
            Educational demonstration only.
          </span>{" "}
          This tool is <span className="font-semibold">not</span> a medical
          device and must never be used for diagnosis or treatment decisions.
        </p>
      </div>
    </div>
  );
}
