import Link from "next/link";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { RecentDay } from "@/lib/recent-days";

// A ruled list, not a card grid or chip strip — every field on the board is a
// row underlined by a rule, never boxed (see DESIGN.md "Shapes"). Selection is
// carried by weight/color and a chalk-white rule, matching the header nav's
// active state: the One Accent Rule reserves strawberry for the primary save
// action and field focus only, never for navigation or selection here.
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
  // "sex." -> "sex": the period reads as a typo once set in tracked uppercase.
  return WEEKDAY_FORMATTER.format(date).replace(".", "");
}

export function RecentDaysList({
  days,
  selectedDate,
}: {
  days: RecentDay[];
  selectedDate: string;
}) {
  return (
    <ul aria-label="Últimos dias" className="flex flex-col">
      {days.map((day) => {
        const date = parseISODate(day.date);
        const isSelected = day.date === selectedDate;
        const isLaunched = day.status === "lancado";

        return (
          <li key={day.date} className="border-b border-board-rule last:border-b-0">
            <Link
              href={`/admin/lancar-preco?data=${day.date}`}
              aria-current={isSelected ? "date" : undefined}
              className={cn(
                "flex min-h-12 items-center justify-between gap-4 border-l-2 py-3 pr-5 pl-4 transition-colors",
                isSelected
                  ? "border-chalk-white bg-chalk-white/[0.06]"
                  : "border-transparent hover:bg-chalk-white/[0.04]"
              )}
            >
              <span className="flex items-baseline gap-3">
                <span className="w-9 shrink-0 text-xs font-bold tracking-[0.14em] text-chalk-label uppercase">
                  {formatWeekday(date)}
                </span>
                <span
                  className={cn(
                    "text-base text-chalk-white",
                    isSelected && "font-bold"
                  )}
                >
                  {DAY_MONTH_FORMATTER.format(date)}
                </span>
              </span>

              <span
                className={cn(
                  "flex shrink-0 items-center gap-1.5 text-xs font-bold tracking-[0.1em] uppercase",
                  isLaunched ? "text-chalk-subtitle" : "text-board-error"
                )}
              >
                {isLaunched ? (
                  <>
                    <Check className="size-3.5" aria-hidden />
                    Lançado
                  </>
                ) : (
                  "Sem lançamento"
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
