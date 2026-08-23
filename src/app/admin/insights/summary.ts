import { STRAWBERRY_CATEGORIES, type StrawberryCategory } from "@/lib/validation/strawberry-price";
import type { PriceHistoryRow } from "./data";

export type SummaryStats = {
  average: number;
  highest: { precoMax: number; data: string; categoria: StrawberryCategory };
  lowest: { precoMin: number; data: string; categoria: StrawberryCategory };
  latest: {
    data: string;
    entries: { categoria: StrawberryCategory; precoMin: number; precoMax: number }[];
  };
};

export function computeSummaryStats(rows: PriceHistoryRow[]): SummaryStats | null {
  if (rows.length === 0) {
    return null;
  }

  const representativeSum = rows.reduce(
    (sum, row) => sum + (row.precoMin + row.precoMax) / 2,
    0
  );
  const average = Math.round((representativeSum / rows.length) * 100) / 100;

  const highest = rows.reduce((best, row) => (row.precoMax > best.precoMax ? row : best));
  const lowest = rows.reduce((best, row) => (row.precoMin < best.precoMin ? row : best));

  const latestDate = rows.reduce((max, row) => (row.data > max ? row.data : max), rows[0].data);
  const latestEntries = rows
    .filter((row) => row.data === latestDate)
    .map((row) => ({ categoria: row.categoria, precoMin: row.precoMin, precoMax: row.precoMax }))
    .sort(
      (a, b) => STRAWBERRY_CATEGORIES.indexOf(a.categoria) - STRAWBERRY_CATEGORIES.indexOf(b.categoria)
    );

  return {
    average,
    highest: { precoMax: highest.precoMax, data: highest.data, categoria: highest.categoria },
    lowest: { precoMin: lowest.precoMin, data: lowest.data, categoria: lowest.categoria },
    latest: { data: latestDate, entries: latestEntries },
  };
}
