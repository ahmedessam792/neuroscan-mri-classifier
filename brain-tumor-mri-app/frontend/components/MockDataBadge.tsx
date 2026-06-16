/**
 * Visible "MOCK DATA" indicator.
 *
 * This badge exists to satisfy the project's critical rule: any temporary
 * mock/simulated result shown during development MUST be clearly marked so it
 * is never mistaken for real model output.
 *
 * The finished app wires every view to the real backend, so this badge should
 * NOT appear anywhere in production. It is kept in the codebase only as a
 * guardrail for future development against an unavailable backend.
 */
export function MockDataBadge() {
  return (
    <div
      role="status"
      className="inline-flex items-center gap-2 rounded-full border border-warning/40 bg-warning/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-warning"
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-warning" />
      Mock data — not a real prediction
    </div>
  );
}
