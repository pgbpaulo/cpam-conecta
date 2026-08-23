import type { StrawberryCategory } from "@/lib/validation/strawberry-price";
import type { PriceHistoryRow } from "./data";

export type TrendPoint = { data: string } & Partial<Record<StrawberryCategory, number>>;

export function buildTrendSeries(rows: PriceHistoryRow[]): TrendPoint[] {
  const byDate = new Map<string, TrendPoint>();

  for (const row of rows) {
    const point = byDate.get(row.data) ?? { data: row.data };
    point[row.categoria] = Math.round(((row.precoMin + row.precoMax) / 2) * 100) / 100;
    byDate.set(row.data, point);
  }

  return Array.from(byDate.values()).sort((a, b) => a.data.localeCompare(b.data));
}
