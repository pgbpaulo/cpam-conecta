import { describe, expect, it } from "vitest";
import { buildAnnualSeries } from "./annual-series";
import type { AnnualAverage } from "./data";

describe("buildAnnualSeries", () => {
  it("groups averages by year with one field per category", () => {
    const averages: AnnualAverage[] = [
      { year: 2025, categoria: "Bom", average: 10.5 },
      { year: 2025, categoria: "Velho", average: 6 },
      { year: 2026, categoria: "Bom", average: 7 },
    ];

    expect(buildAnnualSeries(averages)).toEqual([
      { year: 2025, Bom: 10.5, Velho: 6 },
      { year: 2026, Bom: 7 },
    ]);
  });

  it("returns an empty array for no averages", () => {
    expect(buildAnnualSeries([])).toEqual([]);
  });
});
