import type { StrawberryCategory } from "@/lib/validation/strawberry-price";
import type { AnnualAverage } from "./data";

export type AnnualSeriesPoint = { year: number } & Partial<Record<StrawberryCategory, number>>;

export function buildAnnualSeries(averages: AnnualAverage[]): AnnualSeriesPoint[] {
  const byYear = new Map<number, AnnualSeriesPoint>();

  for (const entry of averages) {
    const point = byYear.get(entry.year) ?? { year: entry.year };
    point[entry.categoria] = entry.average;
    byYear.set(entry.year, point);
  }

  return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
}
