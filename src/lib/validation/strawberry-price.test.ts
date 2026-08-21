import { describe, expect, it } from "vitest";
import { strawberryPriceFormSchema } from "./strawberry-price";

function baseInput(
  overrides: Partial<Record<string, { precoMin?: number; precoMax?: number }>> = {}
) {
  return {
    data: "2026-08-21",
    precos: {
      Velho: {},
      Bom: {},
      "Safra Nova Top": {},
      "Safra Nova Diferenciado": {},
      ...overrides,
    },
  };
}

describe("strawberryPriceFormSchema", () => {
  it("accepts a single filled category with valid min/max", () => {
    const result = strawberryPriceFormSchema.safeParse(
      baseInput({ Bom: { precoMin: 8, precoMax: 10 } })
    );

    expect(result.success).toBe(true);
  });

  it("rejects when every category is empty", () => {
    const result = strawberryPriceFormSchema.safeParse(baseInput());

    expect(result.success).toBe(false);
  });

  it("rejects a category with only precoMin filled", () => {
    const result = strawberryPriceFormSchema.safeParse(baseInput({ Bom: { precoMin: 8 } }));

    expect(result.success).toBe(false);
  });

  it("rejects preco_max below preco_min", () => {
    const result = strawberryPriceFormSchema.safeParse(
      baseInput({ Bom: { precoMin: 10, precoMax: 5 } })
    );

    expect(result.success).toBe(false);
  });

  it("rejects a negative preco_min", () => {
    const result = strawberryPriceFormSchema.safeParse(
      baseInput({ Bom: { precoMin: -1, precoMax: 5 } })
    );

    expect(result.success).toBe(false);
  });

  it("accepts multiple filled categories at once", () => {
    const result = strawberryPriceFormSchema.safeParse(
      baseInput({
        Bom: { precoMin: 8, precoMax: 10 },
        "Safra Nova Top": { precoMin: 12, precoMax: 15 },
      })
    );

    expect(result.success).toBe(true);
  });

  it("rejects an invalid date format", () => {
    const result = strawberryPriceFormSchema.safeParse({
      ...baseInput({ Bom: { precoMin: 8, precoMax: 10 } }),
      data: "21/08/2026",
    });

    expect(result.success).toBe(false);
  });
});
