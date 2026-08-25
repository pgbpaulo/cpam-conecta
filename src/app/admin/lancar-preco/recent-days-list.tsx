"use client";

import Link, { useLinkStatus } from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, Palmtree } from "lucide-react";

import { cn } from "@/lib/utils";
import type { RecentDay } from "@/lib/recent-days";
import { UNSAVED_CHANGES_MESSAGE, useUnsavedChanges } from "./unsaved-changes-context";

// Must be a descendant *component* of the <Link>, not an inline expression
// in the parent's render — useLinkStatus reads context Link provides to its
// subtree. Always rendered at a fixed size so toggling it never shifts the
// row (Next's own useLinkStatus guidance).
function DayLinkPendingHint() {
  const { pending } = useLinkStatus();
  return (
    <Loader2
      aria-hidden
      className={cn(
        "size-3.5 shrink-0 animate-spin text-ink transition-opacity",
        pending ? "opacity-100" : "opacity-0"
      )}
    />
  );
}

// A ruled list — rows underlined by a canvas-soft rule, sitting inside this
// panel's own card-content chrome. Selection reuses the rail nav's exact
// grammar (DESIGN.md's ex-app-shell-row): a primary-green left indicator +
// primary-pale fill, so the two navigation surfaces in this app read as one
// selection language, not two.
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const DAY_MONTH_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
});

function parseISODate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatWeekday(date: Date): string {
  return WEEKDAY_FORMATTER.format(date);
}

export function RecentDaysList({
  days,
  selectedDate,
}: {
  days: RecentDay[];
  selectedDate: string;
}) {
  const router = useRouter();
  const { isDirty } = useUnsavedChanges();

  return (
    <ul aria-label="Últimos dias" className="flex flex-col px-2">
      {days.map((day) => {
        const date = parseISODate(day.date);
        const isSelected = day.date === selectedDate;
        const isLaunched = day.status === "lancado";
        const isHoliday = day.status === "feriado";

        return (
          <li key={day.date} className="border-b border-canvas-soft px-2 last:border-b-0">
            <Link
              href={`/admin/lancar-preco?data=${day.date}`}
              aria-current={isSelected ? "date" : undefined}
              onClick={(event) => {
                if (isSelected || !isDirty) return;
                event.preventDefault();
                if (window.confirm(UNSAVED_CHANGES_MESSAGE)) {
                  router.push(`/admin/lancar-preco?data=${day.date}`);
                }
              }}
              className={cn(
                "flex min-h-12 items-center justify-between gap-4 rounded-r-[8px] border-l-[3px] py-3 pr-3 pl-3.5 transition-colors",
                isSelected
                  ? "border-primary bg-primary-pale"
                  : "border-transparent hover:bg-canvas-soft"
              )}
            >
              <span className="flex items-baseline gap-3">
                <span className="w-9 shrink-0 text-sm text-body">
                  {formatWeekday(date)}
                </span>
                <span
                  className={cn(
                    "text-base text-ink",
                    isSelected && "font-semibold"
                  )}
                >
                  {DAY_MONTH_FORMATTER.format(date)}
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-2">
                <DayLinkPendingHint />
                {isHoliday ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-canvas-soft px-2.5 py-1 text-xs font-semibold text-body">
                    <Palmtree className="size-3.5" aria-hidden />
                    Feriado
                  </span>
                ) : isLaunched ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary-neutral px-2.5 py-1 text-xs font-semibold text-positive-deep">
                    <Check className="size-3.5" aria-hidden />
                    Lançado
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-mute">Sem lançamento</span>
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
