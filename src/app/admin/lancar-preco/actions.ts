"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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
  | {
      status: "validation-error";
      message: string;
      fieldErrors?: Partial<Record<StrawberryCategory, string>>;
    }
  | { status: "error"; message: string };

export type HolidayActionResult = { status: "success" } | { status: "error"; message: string };

const CATEGORY_SET = new Set<string>(STRAWBERRY_CATEGORIES);

export async function savePrices(
  _prevState: SavePricesResult | null,
  input: StrawberryPriceFormValues
): Promise<SavePricesResult> {
  const parsed = strawberryPriceFormSchema.safeParse(input);

  if (!parsed.success) {
    // Zod nests a category refine's issue under path ["precos", "<Categoria>"]
    // (the object schema prepends the key path automatically) — read that
    // back into a per-category map so the form can show each error next to
    // the block it belongs to, instead of one flat message at the bottom.
    const fieldErrors: Partial<Record<StrawberryCategory, string>> = {};
    for (const issue of parsed.error.issues) {
      const [root, categoria] = issue.path;
      if (root === "precos" && typeof categoria === "string" && CATEGORY_SET.has(categoria)) {
        fieldErrors[categoria as StrawberryCategory] = issue.message;
      }
    }

    return {
      status: "validation-error",
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      ...(Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}),
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

  const { data: holidayRow, error: holidayError } = await supabase
    .from("feriados")
    .select("data")
    .eq("data", data)
    .maybeSingle();

  if (holidayError) {
    return { status: "error", message: "Não foi possível salvar. Tente novamente." };
  }

  if (holidayRow) {
    return {
      status: "validation-error",
      message: "Esse dia está marcado como feriado; desmarque antes de lançar preços.",
    };
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

  revalidatePath("/admin/lancar-preco");

  return { status: "success", savedAt: new Date().toISOString(), entries };
}

export async function markHoliday(date: string): Promise<HolidayActionResult> {
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
    .eq("data", date);

  if (existingError) {
    return { status: "error", message: "Não foi possível marcar como feriado. Tente novamente." };
  }

  if (existingRows && existingRows.length > 0) {
    return {
      status: "error",
      message: "Não é possível marcar como feriado: já existem preços lançados para esse dia.",
    };
  }

  const { error: insertError } = await supabase
    .from("feriados")
    .insert({ data: date, marcado_por: user.id });

  if (insertError) {
    return { status: "error", message: "Não foi possível marcar como feriado. Tente novamente." };
  }

  revalidatePath("/admin/lancar-preco");

  return { status: "success" };
}

export async function unmarkHoliday(date: string): Promise<HolidayActionResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("feriados").delete().eq("data", date);

  if (error) {
    return { status: "error", message: "Não foi possível desmarcar o feriado. Tente novamente." };
  }

  revalidatePath("/admin/lancar-preco");

  return { status: "success" };
}
