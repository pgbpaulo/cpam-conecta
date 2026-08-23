import { createSupabaseServerClient } from "@/lib/supabase/server";
import { STRAWBERRY_CATEGORIES, type StrawberryCategory } from "@/lib/validation/strawberry-price";
import { rangeToDateInterval, type InsightsRange } from "./date-range";

export type PriceHistoryRow = {
  data: string;
  categoria: StrawberryCategory;
  precoMin: number;
  precoMax: number;
};

export async function getPriceHistory(
  range: InsightsRange,
  today: Date
): Promise<PriceHistoryRow[]> {
  const supabase = await createSupabaseServerClient();
  const { from, to } = rangeToDateInterval(range, today);

  const { data, error } = await supabase
    .from("precos_morango")
    .select("data, categoria, preco_min, preco_max")
    .gte("data", from)
    .lte("data", to)
    .order("data", { ascending: true });

  if (error) {
    throw new Error(`Falha ao buscar histórico de preços: ${error.message}`);
  }

  return (data ?? []).map(
    (row: { data: string; categoria: string; preco_min: number; preco_max: number }) => ({
      data: row.data,
      categoria: row.categoria as StrawberryCategory,
      precoMin: Number(row.preco_min),
      precoMax: Number(row.preco_max),
    })
  );
}

export type AnnualAverage = {
  year: number;
  categoria: StrawberryCategory;
  average: number;
};

export async function getAnnualAverages(): Promise<AnnualAverage[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("precos_morango")
    .select("data, categoria, preco_min, preco_max");

  if (error) {
    throw new Error(`Falha ao buscar médias anuais: ${error.message}`);
  }

  const sums = new Map<
    string,
    { year: number; categoria: StrawberryCategory; total: number; count: number }
  >();

  for (const row of (data ?? []) as {
    data: string;
    categoria: string;
    preco_min: number;
    preco_max: number;
  }[]) {
    const year = Number(row.data.slice(0, 4));
    const categoria = row.categoria as StrawberryCategory;
    const key = `${year}-${categoria}`;
    const representative = (Number(row.preco_min) + Number(row.preco_max)) / 2;

    const existing = sums.get(key);
    if (existing) {
      existing.total += representative;
      existing.count += 1;
    } else {
      sums.set(key, { year, categoria, total: representative, count: 1 });
    }
  }

  return Array.from(sums.values())
    .map(({ year, categoria, total, count }) => ({
      year,
      categoria,
      average: Math.round((total / count) * 100) / 100,
    }))
    .sort(
      (a, b) =>
        a.year - b.year ||
        STRAWBERRY_CATEGORIES.indexOf(a.categoria) - STRAWBERRY_CATEGORIES.indexOf(b.categoria)
    );
}
