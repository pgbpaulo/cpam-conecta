import { STRAWBERRY_CATEGORIES, type StrawberryCategory } from "@/lib/validation/strawberry-price";
import type { PriceHistoryRow } from "./data";

export type CategoryExtreme = {
  categoria: StrawberryCategory;
  min: number | null;
  max: number | null;
};

export function computeCategoryExtremes(rows: PriceHistoryRow[]): CategoryExtreme[] {
  return STRAWBERRY_CATEGORIES.map((categoria) => {
    const categoryRows = rows.filter((row) => row.categoria === categoria);

    if (categoryRows.length === 0) {
      return { categoria, min: null, max: null };
    }

    const min = categoryRows.reduce((lowest, row) => Math.min(lowest, row.precoMin), Infinity);
    const max = categoryRows.reduce((highest, row) => Math.max(highest, row.precoMax), -Infinity);

    return { categoria, min, max };
  });
}
