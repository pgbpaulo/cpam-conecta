import Link from "next/link";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { RecentDay } from "@/lib/recent-days";

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
  return (
    <ul aria-label="Últimos dias" className="flex flex-col px-2">
      {days.map((day) => {
        const date = parseISODate(day.date);
        const isSelected = day.date === selectedDate;
        const isLaunched = day.status === "lancado";

        return (
          <li key={day.date} className="border-b border-canvas-soft px-2 last:border-b-0">
            <Link
              href={`/admin/lancar-preco?data=${day.date}`}
              aria-current={isSelected ? "date" : undefined}
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

              {isLaunched ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary-neutral px-2.5 py-1 text-xs font-semibold text-positive-deep">
                  <Check className="size-3.5" aria-hidden />
                  Lançado
                </span>
              ) : (
                <span className="shrink-0 text-xs text-mute">Sem lançamento</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
