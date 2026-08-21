import { z } from "zod";

export const STRAWBERRY_CATEGORIES = [
  "Velho",
  "Bom",
  "Safra Nova Top",
  "Safra Nova Diferenciado",
] as const;

export type StrawberryCategory = (typeof STRAWBERRY_CATEGORIES)[number];

export type CategoryPriceInput = {
  precoMin?: number;
  precoMax?: number;
};

const categoryPriceSchema = z
  .object({
    precoMin: z.number().min(0, "O preço mínimo não pode ser negativo.").optional(),
    precoMax: z.number().min(0, "O preço máximo não pode ser negativo.").optional(),
  })
  .refine((value) => (value.precoMin === undefined) === (value.precoMax === undefined), {
    message: "Preencha os dois valores ou deixe os dois em branco.",
  })
  .refine(
    (value) =>
      value.precoMin === undefined ||
      value.precoMax === undefined ||
      value.precoMax >= value.precoMin,
    { message: "O preço máximo não pode ser menor que o mínimo." }
  );

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

export const strawberryPriceFormSchema = z
  .object({
    data: dateSchema,
    precos: z.object({
      Velho: categoryPriceSchema,
      Bom: categoryPriceSchema,
      "Safra Nova Top": categoryPriceSchema,
      "Safra Nova Diferenciado": categoryPriceSchema,
    }),
  })
  .refine(
    (value) =>
      Object.values(value.precos).some(
        (entry) => entry.precoMin !== undefined && entry.precoMax !== undefined
      ),
    { message: "Preencha ao menos uma categoria para salvar." }
  );

export type StrawberryPriceFormValues = z.infer<typeof strawberryPriceFormSchema>;
