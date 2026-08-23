import { describe, expect, it, vi, beforeEach } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({ from: fromMock }),
}));

import { getPriceHistory, getAnnualAverages } from "./data";

// `.range()` is the terminal call in both getPriceHistory and
// getAnnualAverages now (pagination). `results` is consumed one item per
// `.range()` call, in order, so tests can control what each page returns.
function historyBuilder(...results: { data: unknown; error: unknown }[]) {
  const range = vi.fn();
  results.forEach((result) => range.mockResolvedValueOnce(result));

  const builder = {
    select: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    order: vi.fn(() => builder),
    range,
  };
  return builder;
}

function allRowsBuilder(...results: { data: unknown; error: unknown }[]) {
  const range = vi.fn();
  results.forEach((result) => range.mockResolvedValueOnce(result));

  const builder = {
    select: vi.fn(() => builder),
    order: vi.fn(() => builder),
    range,
  };
  return builder;
}

function makeRows(count: number, data: string) {
  return Array.from({ length: count }, () => ({
    data,
    categoria: "Bom",
    preco_min: 8,
    preco_max: 10,
  }));
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

  it("pages through results, fetching a second page when the first is exactly PAGE_SIZE rows", async () => {
    const page1 = makeRows(1000, "2026-08-20");
    const page2 = makeRows(3, "2026-08-21");
    const builder = historyBuilder(
      { data: page1, error: null },
      { data: page2, error: null }
    );
    fromMock.mockReturnValue(builder);

    const rows = await getPriceHistory("tudo", new Date("2026-08-23T12:00:00"));

    expect(builder.range).toHaveBeenCalledTimes(2);
    expect(builder.range).toHaveBeenNthCalledWith(1, 0, 999);
    expect(builder.range).toHaveBeenNthCalledWith(2, 1000, 1999);
    expect(rows).toHaveLength(1003);
  });

  it("does not fetch a second page when the first page is shorter than PAGE_SIZE", async () => {
    const page1 = makeRows(3, "2026-08-20");
    const builder = historyBuilder({ data: page1, error: null });
    fromMock.mockReturnValue(builder);

    const rows = await getPriceHistory("30d", new Date("2026-08-23T12:00:00"));

    expect(builder.range).toHaveBeenCalledTimes(1);
    expect(rows).toHaveLength(3);
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

  it("pages through results, fetching a second page when the first is exactly PAGE_SIZE rows", async () => {
    const page1 = makeRows(1000, "2025-01-01");
    const page2 = makeRows(2, "2026-01-01");
    const builder = allRowsBuilder(
      { data: page1, error: null },
      { data: page2, error: null }
    );
    fromMock.mockReturnValue(builder);

    const averages = await getAnnualAverages();

    expect(builder.range).toHaveBeenCalledTimes(2);
    expect(builder.range).toHaveBeenNthCalledWith(1, 0, 999);
    expect(builder.range).toHaveBeenNthCalledWith(2, 1000, 1999);
    expect(averages).toEqual([
      { year: 2025, categoria: "Bom", average: 9 },
      { year: 2026, categoria: "Bom", average: 9 },
    ]);
  });

  it("does not fetch a second page when the first page is shorter than PAGE_SIZE", async () => {
    const page1 = makeRows(3, "2025-01-01");
    const builder = allRowsBuilder({ data: page1, error: null });
    fromMock.mockReturnValue(builder);

    await getAnnualAverages();

    expect(builder.range).toHaveBeenCalledTimes(1);
  });
});
