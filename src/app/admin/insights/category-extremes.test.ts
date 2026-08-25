import { describe, expect, it } from "vitest";
import { computeCategoryExtremes } from "./category-extremes";
import type { PriceHistoryRow } from "./data";

describe("computeCategoryExtremes", () => {
  it("computes the min and max price for each category present in the rows", () => {
    const rows: PriceHistoryRow[] = [
      { data: "2026-08-20", categoria: "Bom", precoMin: 8, precoMax: 10 },
      { data: "2026-08-21", categoria: "Bom", precoMin: 9, precoMax: 13 },
      { data: "2026-08-21", categoria: "Velho", precoMin: 4, precoMax: 6 },
    ];

    const extremes = computeCategoryExtremes(rows);

    expect(extremes).toEqual([
      { categoria: "Velho", min: 4, max: 6 },
      { categoria: "Bom", min: 8, max: 13 },
      { categoria: "Safra Nova Top", min: null, max: null },
      { categoria: "Safra Nova Diferenciado", min: null, max: null },
    ]);
  });

  it("returns null min/max for every category when there are no rows", () => {
    const extremes = computeCategoryExtremes([]);

    expect(extremes).toEqual([
      { categoria: "Velho", min: null, max: null },
      { categoria: "Bom", min: null, max: null },
      { categoria: "Safra Nova Top", min: null, max: null },
      { categoria: "Safra Nova Diferenciado", min: null, max: null },
    ]);
  });
});
