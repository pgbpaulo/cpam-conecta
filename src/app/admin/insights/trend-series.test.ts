import { describe, expect, it } from "vitest";
import { buildTrendSeries } from "./trend-series";
import type { PriceHistoryRow } from "./data";

describe("buildTrendSeries", () => {
  it("groups rows by date with one field per category, averaging min/max", () => {
    const rows: PriceHistoryRow[] = [
      { data: "2026-08-20", categoria: "Bom", precoMin: 8, precoMax: 10 },
      { data: "2026-08-20", categoria: "Velho", precoMin: 4, precoMax: 6 },
      { data: "2026-08-21", categoria: "Bom", precoMin: 9, precoMax: 11 },
    ];

    expect(buildTrendSeries(rows)).toEqual([
      { data: "2026-08-20", Bom: 9, Velho: 5 },
      { data: "2026-08-21", Bom: 10 },
    ]);
  });

  it("returns an empty array for no rows", () => {
    expect(buildTrendSeries([])).toEqual([]);
  });
});
