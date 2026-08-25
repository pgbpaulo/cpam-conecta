import { describe, expect, it, vi, beforeEach } from "vitest";
import type { StrawberryPriceFormValues } from "@/lib/validation/strawberry-price";

const getUser = vi.fn();
const fromMock = vi.fn();
const redirectMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({ auth: { getUser }, from: fromMock }),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    redirectMock(path);
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { savePrices, markHoliday, unmarkHoliday } from "./actions";

function emptyPrecos(): StrawberryPriceFormValues["precos"] {
  return {
    Velho: {},
    Bom: {},
    "Safra Nova Top": {},
    "Safra Nova Diferenciado": {},
  };
}

function selectExistingBuilder(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue(result),
  };
}

function maybeSingleBuilder(result: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
  };
  return builder;
}

function upsertBuilder(result: { error: unknown }) {
  const upsert = vi.fn().mockResolvedValue(result);
  return { builder: { upsert }, upsert };
}

function insertBuilder(result: { error: unknown }) {
  const insert = vi.fn().mockResolvedValue(result);
  return { builder: { insert }, insert };
}

function deleteBuilder(result: { error: unknown }) {
  const eqMock = vi.fn().mockResolvedValue(result);
  const deleteMock = vi.fn(() => ({ eq: eqMock }));
  return { builder: { delete: deleteMock }, eqMock };
}

describe("savePrices", () => {
  beforeEach(() => {
    getUser.mockReset();
    fromMock.mockReset();
    redirectMock.mockReset();
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("returns a validation error when no category is filled", async () => {
    const input: StrawberryPriceFormValues = { data: "2026-08-21", precos: emptyPrecos() };

    const result = await savePrices(null, input);

    expect(result.status).toBe("validation-error");
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("returns a validation error when preco_max is below preco_min, naming the category", async () => {
    const input: StrawberryPriceFormValues = {
      data: "2026-08-21",
      precos: { ...emptyPrecos(), Bom: { precoMin: 10, precoMax: 5 } },
    };

    const result = await savePrices(null, input);

    expect(result.status).toBe("validation-error");
    if (result.status !== "validation-error") throw new Error("expected validation-error");
    expect(result.fieldErrors).toEqual({
      Bom: "O preço máximo não pode ser menor que o mínimo.",
    });
  });

  it("returns a validation error when the date is marked as a holiday", async () => {
    fromMock.mockReturnValueOnce(
      maybeSingleBuilder({ data: { data: "2026-08-21" }, error: null })
    );

    const input: StrawberryPriceFormValues = {
      data: "2026-08-21",
      precos: { ...emptyPrecos(), Bom: { precoMin: 8, precoMax: 10 } },
    };

    const result = await savePrices(null, input);

    expect(fromMock).toHaveBeenCalledWith("feriados");
    expect(result).toEqual({
      status: "validation-error",
      message: "Esse dia está marcado como feriado; desmarque antes de lançar preços.",
    });
  });

  it("upserts a filled category with the right payload and marks it as new when no row exists", async () => {
    const { builder, upsert } = upsertBuilder({ error: null });
    fromMock
      .mockReturnValueOnce(maybeSingleBuilder({ data: null, error: null }))
      .mockReturnValueOnce(selectExistingBuilder({ data: [], error: null }))
      .mockReturnValueOnce(builder);

    const input: StrawberryPriceFormValues = {
      data: "2026-08-21",
      precos: { ...emptyPrecos(), Bom: { precoMin: 8, precoMax: 10 } },
    };

    const result = await savePrices(null, input);

    expect(result).toEqual({
      status: "success",
      savedAt: expect.any(String),
      entries: [{ categoria: "Bom", precoMin: 8, precoMax: 10, wasUpdate: false }],
    });

    expect(upsert).toHaveBeenCalledWith(
      [
        {
          data: "2026-08-21",
          categoria: "Bom",
          preco_min: 8,
          preco_max: 10,
          lancado_por: "user-1",
        },
      ],
      { onConflict: "data,categoria" }
    );
  });

  it("marks a category as an update when a row already exists for that date", async () => {
    const { builder } = upsertBuilder({ error: null });
    fromMock
      .mockReturnValueOnce(maybeSingleBuilder({ data: null, error: null }))
      .mockReturnValueOnce(selectExistingBuilder({ data: [{ categoria: "Bom" }], error: null }))
      .mockReturnValueOnce(builder);

    const input: StrawberryPriceFormValues = {
      data: "2026-08-21",
      precos: { ...emptyPrecos(), Bom: { precoMin: 8, precoMax: 10 } },
    };

    const result = await savePrices(null, input);

    if (result.status !== "success") throw new Error("expected success");
    expect(result.entries[0].wasUpdate).toBe(true);
  });

  it("returns an error status when the upsert fails", async () => {
    const { builder } = upsertBuilder({ error: { message: "boom" } });
    fromMock
      .mockReturnValueOnce(maybeSingleBuilder({ data: null, error: null }))
      .mockReturnValueOnce(selectExistingBuilder({ data: [], error: null }))
      .mockReturnValueOnce(builder);

    const input: StrawberryPriceFormValues = {
      data: "2026-08-21",
      precos: { ...emptyPrecos(), Bom: { precoMin: 8, precoMax: 10 } },
    };

    const result = await savePrices(null, input);

    expect(result).toEqual({
      status: "error",
      message: "Não foi possível salvar. Tente novamente.",
    });
  });

  it("redirects to /login when there is no authenticated user", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const input: StrawberryPriceFormValues = {
      data: "2026-08-21",
      precos: { ...emptyPrecos(), Bom: { precoMin: 8, precoMax: 10 } },
    };

    await expect(savePrices(null, input)).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});

describe("markHoliday", () => {
  beforeEach(() => {
    getUser.mockReset();
    fromMock.mockReset();
    redirectMock.mockReset();
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("returns an error when prices already exist for that date", async () => {
    fromMock.mockReturnValueOnce(
      selectExistingBuilder({ data: [{ categoria: "Bom" }], error: null })
    );

    const result = await markHoliday("2026-08-21");

    expect(fromMock).toHaveBeenCalledWith("precos_morango");
    expect(result).toEqual({
      status: "error",
      message: "Não é possível marcar como feriado: já existem preços lançados para esse dia.",
    });
  });

  it("marks a day as a holiday when no prices exist for that date", async () => {
    const { builder, insert } = insertBuilder({ error: null });
    fromMock
      .mockReturnValueOnce(selectExistingBuilder({ data: [], error: null }))
      .mockReturnValueOnce(builder);

    const result = await markHoliday("2026-08-21");

    expect(fromMock).toHaveBeenCalledWith("feriados");
    expect(insert).toHaveBeenCalledWith({ data: "2026-08-21", marcado_por: "user-1" });
    expect(result).toEqual({ status: "success" });
  });

  it("returns an error status when the insert fails", async () => {
    const { builder } = insertBuilder({ error: { message: "boom" } });
    fromMock
      .mockReturnValueOnce(selectExistingBuilder({ data: [], error: null }))
      .mockReturnValueOnce(builder);

    const result = await markHoliday("2026-08-21");

    expect(result).toEqual({
      status: "error",
      message: "Não foi possível marcar como feriado. Tente novamente.",
    });
  });

  it("redirects to /login when there is no authenticated user", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    await expect(markHoliday("2026-08-21")).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});

describe("unmarkHoliday", () => {
  beforeEach(() => {
    getUser.mockReset();
    fromMock.mockReset();
    redirectMock.mockReset();
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("deletes the feriado row for that date", async () => {
    const { builder, eqMock } = deleteBuilder({ error: null });
    fromMock.mockReturnValueOnce(builder);

    const result = await unmarkHoliday("2026-08-21");

    expect(fromMock).toHaveBeenCalledWith("feriados");
    expect(eqMock).toHaveBeenCalledWith("data", "2026-08-21");
    expect(result).toEqual({ status: "success" });
  });

  it("returns an error status when the delete fails", async () => {
    const { builder } = deleteBuilder({ error: { message: "boom" } });
    fromMock.mockReturnValueOnce(builder);

    const result = await unmarkHoliday("2026-08-21");

    expect(result).toEqual({
      status: "error",
      message: "Não foi possível desmarcar o feriado. Tente novamente.",
    });
  });

  it("redirects to /login when there is no authenticated user", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    await expect(unmarkHoliday("2026-08-21")).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
