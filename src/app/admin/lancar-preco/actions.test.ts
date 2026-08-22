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

import { savePrices } from "./actions";

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

function upsertBuilder(result: { error: unknown }) {
  return {
    upsert: vi.fn().mockResolvedValue(result),
  };
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

  it("returns a validation error when preco_max is below preco_min", async () => {
    const input: StrawberryPriceFormValues = {
      data: "2026-08-21",
      precos: { ...emptyPrecos(), Bom: { precoMin: 10, precoMax: 5 } },
    };

    const result = await savePrices(null, input);

    expect(result.status).toBe("validation-error");
  });

  it("upserts a filled category and marks it as new when no row exists", async () => {
    fromMock
      .mockReturnValueOnce(selectExistingBuilder({ data: [], error: null }))
      .mockReturnValueOnce(upsertBuilder({ error: null }));

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
  });

  it("marks a category as an update when a row already exists for that date", async () => {
    fromMock
      .mockReturnValueOnce(
        selectExistingBuilder({ data: [{ categoria: "Bom" }], error: null })
      )
      .mockReturnValueOnce(upsertBuilder({ error: null }));

    const input: StrawberryPriceFormValues = {
      data: "2026-08-21",
      precos: { ...emptyPrecos(), Bom: { precoMin: 8, precoMax: 10 } },
    };

    const result = await savePrices(null, input);

    if (result.status !== "success") throw new Error("expected success");
    expect(result.entries[0].wasUpdate).toBe(true);
  });

  it("returns an error status when the upsert fails", async () => {
    fromMock
      .mockReturnValueOnce(selectExistingBuilder({ data: [], error: null }))
      .mockReturnValueOnce(upsertBuilder({ error: { message: "boom" } }));

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
