"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  STRAWBERRY_CATEGORIES,
  strawberryPriceFormSchema,
  type StrawberryCategory,
  type StrawberryPriceFormValues,
} from "@/lib/validation/strawberry-price";

export type SavedEntry = {
  categoria: StrawberryCategory;
  precoMin: number;
  precoMax: number;
  wasUpdate: boolean;
};

export type SavePricesResult =
  | { status: "success"; savedAt: string; entries: SavedEntry[] }
  | { status: "validation-error"; message: string }
  | { status: "error"; message: string };

export async function savePrices(
  _prevState: SavePricesResult | null,
  input: StrawberryPriceFormValues
): Promise<SavePricesResult> {
  const parsed = strawberryPriceFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "validation-error",
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { data, precos } = parsed.data;

  const categoriesToSave = STRAWBERRY_CATEGORIES.filter((categoria) => {
    const entry = precos[categoria];
    return entry.precoMin !== undefined && entry.precoMax !== undefined;
  });

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("precos_morango")
    .select("categoria")
    .eq("data", data);

  if (existingError) {
    return { status: "error", message: "Não foi possível salvar. Tente novamente." };
  }

  const existingCategories = new Set(
    (existingRows ?? []).map((row: { categoria: string }) => row.categoria as StrawberryCategory)
  );

  const rows = categoriesToSave.map((categoria) => ({
    data,
    categoria,
    preco_min: precos[categoria].precoMin,
    preco_max: precos[categoria].precoMax,
    lancado_por: user.id,
  }));

  const { error: upsertError } = await supabase
    .from("precos_morango")
    .upsert(rows, { onConflict: "data,categoria" });

  if (upsertError) {
    return { status: "error", message: "Não foi possível salvar. Tente novamente." };
  }

  const entries: SavedEntry[] = categoriesToSave.map((categoria) => ({
    categoria,
    precoMin: precos[categoria].precoMin!,
    precoMax: precos[categoria].precoMax!,
    wasUpdate: existingCategories.has(categoria),
  }));

  return { status: "success", savedAt: new Date().toISOString(), entries };
}
