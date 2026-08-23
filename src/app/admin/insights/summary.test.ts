import { describe, expect, it } from "vitest";
import { computeSummaryStats } from "./summary";
import type { PriceHistoryRow } from "./data";

describe("computeSummaryStats", () => {
  it("returns null for an empty period", () => {
    expect(computeSummaryStats([])).toBeNull();
  });

  it("computes average, highest, lowest, and latest entries", () => {
    const rows: PriceHistoryRow[] = [
      { data: "2026-08-20", categoria: "Bom", precoMin: 8, precoMax: 10 },
      { data: "2026-08-21", categoria: "Velho", precoMin: 4, precoMax: 6 },
      { data: "2026-08-21", categoria: "Bom", precoMin: 9, precoMax: 13 },
    ];

    const stats = computeSummaryStats(rows);

    expect(stats?.average).toBe(8.33);
    expect(stats?.highest).toEqual({ precoMax: 13, data: "2026-08-21", categoria: "Bom" });
    expect(stats?.lowest).toEqual({ precoMin: 4, data: "2026-08-21", categoria: "Velho" });
    expect(stats?.latest).toEqual({
      data: "2026-08-21",
      entries: [
        { categoria: "Velho", precoMin: 4, precoMax: 6 },
        { categoria: "Bom", precoMin: 9, precoMax: 13 },
      ],
    });
  });
});
