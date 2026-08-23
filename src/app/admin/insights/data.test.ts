import { describe, expect, it, vi, beforeEach } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({ from: fromMock }),
}));

import { getPriceHistory, getAnnualAverages } from "./data";

function historyBuilder(result: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    order: vi.fn(() => Promise.resolve(result)),
  };
  return builder;
}

function allRowsBuilder(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn(() => Promise.resolve(result)),
  };
}

describe("getPriceHistory", () => {
  beforeEach(() => fromMock.mockReset());

  it("maps rows returned for the selected range", async () => {
    fromMock.mockReturnValue(
      historyBuilder({
        data: [{ data: "2026-08-20", categoria: "Bom", preco_min: 8, preco_max: 10 }],
        error: null,
      })
    );

    const rows = await getPriceHistory("30d", new Date("2026-08-23T12:00:00"));

    expect(fromMock).toHaveBeenCalledWith("precos_morango");
    expect(rows).toEqual([
      { data: "2026-08-20", categoria: "Bom", precoMin: 8, precoMax: 10 },
    ]);
  });

  it("throws when Supabase returns an error", async () => {
    fromMock.mockReturnValue(historyBuilder({ data: null, error: { message: "boom" } }));

    await expect(getPriceHistory("30d", new Date("2026-08-23T12:00:00"))).rejects.toThrow(
      "Falha ao buscar histórico de preços"
    );
  });
});

describe("getAnnualAverages", () => {
  beforeEach(() => fromMock.mockReset());

  it("averages (min+max)/2 grouped by year and category", async () => {
    fromMock.mockReturnValue(
      allRowsBuilder({
        data: [
          { data: "2025-03-10", categoria: "Bom", preco_min: 8, preco_max: 10 },
          { data: "2025-06-01", categoria: "Bom", preco_min: 10, preco_max: 14 },
          { data: "2026-01-15", categoria: "Bom", preco_min: 6, preco_max: 8 },
        ],
        error: null,
      })
    );

    const averages = await getAnnualAverages();

    expect(averages).toEqual([
      { year: 2025, categoria: "Bom", average: 10.5 },
      { year: 2026, categoria: "Bom", average: 7 },
    ]);
  });

  it("throws when Supabase returns an error", async () => {
    fromMock.mockReturnValue(allRowsBuilder({ data: null, error: { message: "boom" } }));

    await expect(getAnnualAverages()).rejects.toThrow("Falha ao buscar médias anuais");
  });
});
