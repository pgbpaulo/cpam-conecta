import { describe, expect, it, vi, beforeEach } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({ from: fromMock }),
}));

import { getRecentDays, getDayPrices, getDayHoliday } from "./data";

function selectBuilder(result: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lte: vi.fn(() => Promise.resolve(result)),
    eq: vi.fn(() => Promise.resolve(result)),
  };
  return builder;
}

function maybeSingleBuilder(result: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
  };
  return builder;
}

describe("getRecentDays", () => {
  beforeEach(() => fromMock.mockReset());

  it("marks dates present in the precos query result as lancado", async () => {
    fromMock
      .mockReturnValueOnce(selectBuilder({ data: [{ data: "2026-08-20" }], error: null }))
      .mockReturnValueOnce(selectBuilder({ data: [], error: null }));

    const days = await getRecentDays(new Date("2026-08-21T12:00:00"));

    expect(fromMock).toHaveBeenCalledWith("precos_morango");
    expect(days.find((d) => d.date === "2026-08-20")?.status).toBe("lancado");
    expect(days.find((d) => d.date === "2026-08-19")?.status).toBe("sem-lancamento");
  });

  it("marks dates present in the feriados query result as feriado", async () => {
    fromMock
      .mockReturnValueOnce(selectBuilder({ data: [], error: null }))
      .mockReturnValueOnce(selectBuilder({ data: [{ data: "2026-08-19" }], error: null }));

    const days = await getRecentDays(new Date("2026-08-21T12:00:00"));

    expect(fromMock).toHaveBeenCalledWith("feriados");
    expect(days.find((d) => d.date === "2026-08-19")?.status).toBe("feriado");
  });

  it("throws when the precos query returns an error", async () => {
    fromMock.mockReturnValueOnce(selectBuilder({ data: null, error: { message: "boom" } }));

    await expect(getRecentDays(new Date("2026-08-21T12:00:00"))).rejects.toThrow(
      "Falha ao buscar dias com lançamento"
    );
  });

  it("throws when the feriados query returns an error", async () => {
    fromMock
      .mockReturnValueOnce(selectBuilder({ data: [], error: null }))
      .mockReturnValueOnce(selectBuilder({ data: null, error: { message: "boom" } }));

    await expect(getRecentDays(new Date("2026-08-21T12:00:00"))).rejects.toThrow(
      "Falha ao buscar feriados"
    );
  });
});

describe("getDayHoliday", () => {
  beforeEach(() => fromMock.mockReset());

  it("returns true when a feriado row exists for the date", async () => {
    fromMock.mockReturnValue(maybeSingleBuilder({ data: { data: "2026-08-21" }, error: null }));

    const isHoliday = await getDayHoliday("2026-08-21");

    expect(fromMock).toHaveBeenCalledWith("feriados");
    expect(isHoliday).toBe(true);
  });

  it("returns false when no feriado row exists for the date", async () => {
    fromMock.mockReturnValue(maybeSingleBuilder({ data: null, error: null }));

    const isHoliday = await getDayHoliday("2026-08-21");

    expect(isHoliday).toBe(false);
  });

  it("throws when Supabase returns an error", async () => {
    fromMock.mockReturnValue(maybeSingleBuilder({ data: null, error: { message: "boom" } }));

    await expect(getDayHoliday("2026-08-21")).rejects.toThrow("Falha ao buscar feriado");
  });
});

describe("getDayPrices", () => {
  beforeEach(() => fromMock.mockReset());

  it("fills in only the categories that have rows", async () => {
    fromMock.mockReturnValue(
      selectBuilder({
        data: [{ categoria: "Bom", preco_min: 8, preco_max: 10 }],
        error: null,
      })
    );

    const values = await getDayPrices("2026-08-21");

    expect(values.Bom).toEqual({ precoMin: 8, precoMax: 10 });
    expect(values.Velho).toEqual({});
  });

  it("throws when Supabase returns an error", async () => {
    fromMock.mockReturnValue(selectBuilder({ data: null, error: { message: "boom" } }));

    await expect(getDayPrices("2026-08-21")).rejects.toThrow("Falha ao buscar preços do dia");
  });
});
