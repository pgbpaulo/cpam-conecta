import Link from "next/link";

import { cn } from "@/lib/utils";
import { INSIGHTS_RANGES, type InsightsRange } from "./date-range";
import { PeriodFilterPendingHint } from "./period-filter-pending-hint";

const RANGE_LABELS: Record<InsightsRange, string> = {
  "30d": "30 dias",
  "90d": "90 dias",
  ano: "Este ano",
  tudo: "Tudo",
};

// The insights page's period filter — four plain <Link> navigations to
// `?range=X`, so switching periods works without JS/hydration (server
// component, no client-side state). Deliberately not built on `NavLink`:
// DESIGN.md reserves the lime-green primary for CTAs and the *page* nav's
// active indicator (its own `ex-app-shell-row` example carves out that one
// other use) — this is a filter, not a menu item, so it shouldn't reach for
// a second use of the accent. Selection instead borrows the system's own
// elevation vocabulary: a white `canvas` track lifted on the sage page
// ground, with the active option punched through to `canvas-soft` — the
// same two surfaces DESIGN.md already uses everywhere else for contrast.
export function PeriodFilter({ current }: { current: InsightsRange }) {
  return (
    <nav
      aria-label="Período"
      className="inline-flex w-full gap-1 overflow-x-auto rounded-full bg-canvas p-1 sm:w-auto"
    >
      {INSIGHTS_RANGES.map((range) => {
        const isActive = range === current;

        return (
          <Link
            key={range}
            href={`/admin/insights?range=${range}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex-1 shrink-0 rounded-full px-4 py-2 text-center text-sm whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:flex-none",
              isActive
                ? "bg-canvas-soft font-semibold text-ink"
                : "text-body hover:text-ink"
            )}
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              {RANGE_LABELS[range]}
              <PeriodFilterPendingHint />
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
