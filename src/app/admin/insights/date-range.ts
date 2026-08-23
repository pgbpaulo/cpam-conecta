import { toISODate } from "@/lib/recent-days";

export const INSIGHTS_RANGES = ["30d", "90d", "ano", "tudo"] as const;
export type InsightsRange = (typeof INSIGHTS_RANGES)[number];

// Predates any real lançamento — used as an unbounded lower limit for
// "tudo" so the query code path never needs a conditional filter.
const HISTORY_START = "1900-01-01";

export function rangeToDateInterval(
  range: InsightsRange,
  today: Date
): { from: string; to: string } {
  const to = toISODate(today);

  if (range === "tudo") {
    return { from: HISTORY_START, to };
  }

  if (range === "ano") {
    const yearStart = new Date(today.getFullYear(), 0, 1);
    return { from: toISODate(yearStart), to };
  }

  const days = range === "30d" ? 30 : 90;
  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));
  return { from: toISODate(from), to };
}
