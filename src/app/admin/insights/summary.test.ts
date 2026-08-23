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

  it("sorts latest.entries by STRAWBERRY_CATEGORIES order regardless of input row order", () => {
    // Rows are fed in reverse STRAWBERRY_CATEGORIES order (and not grouped
    // by date) to make sure the sort is applied, not just coincidentally
    // already correct — see Finding 3 of the final review.
    const rows: PriceHistoryRow[] = [
      { data: "2026-08-21", categoria: "Safra Nova Diferenciado", precoMin: 5, precoMax: 7 },
      { data: "2026-08-21", categoria: "Safra Nova Top", precoMin: 6, precoMax: 8 },
      { data: "2026-08-21", categoria: "Bom", precoMin: 9, precoMax: 13 },
      { data: "2026-08-21", categoria: "Velho", precoMin: 4, precoMax: 6 },
    ];

    const stats = computeSummaryStats(rows);

    expect(stats?.latest).toEqual({
      data: "2026-08-21",
      entries: [
        { categoria: "Velho", precoMin: 4, precoMax: 6 },
        { categoria: "Bom", precoMin: 9, precoMax: 13 },
        { categoria: "Safra Nova Top", precoMin: 6, precoMax: 8 },
        { categoria: "Safra Nova Diferenciado", precoMin: 5, precoMax: 7 },
      ],
    });
  });
});
