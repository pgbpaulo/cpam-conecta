import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  STRAWBERRY_CATEGORIES,
  type StrawberryCategory,
  type CategoryPriceInput,
} from "@/lib/validation/strawberry-price";
import { computeRecentDays, toISODate, type RecentDay } from "@/lib/recent-days";

const WINDOW_DAYS = 15;

export async function getRecentDays(today: Date): Promise<RecentDay[]> {
  const supabase = await createSupabaseServerClient();

  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - (WINDOW_DAYS - 1));

  const { data, error } = await supabase
    .from("precos_morango")
    .select("data")
    .gte("data", toISODate(windowStart))
    .lte("data", toISODate(today));

  if (error) {
    throw new Error(`Falha ao buscar dias com lançamento: ${error.message}`);
  }

  const launchedDates = new Set((data ?? []).map((row: { data: string }) => row.data));

  return computeRecentDays(today, launchedDates, WINDOW_DAYS);
}

export async function getDayPrices(
  date: string
): Promise<Record<StrawberryCategory, CategoryPriceInput>> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("precos_morango")
    .select("categoria, preco_min, preco_max")
    .eq("data", date);

  if (error) {
    throw new Error(`Falha ao buscar preços do dia: ${error.message}`);
  }

  const values = Object.fromEntries(
    STRAWBERRY_CATEGORIES.map((categoria) => [categoria, {}])
  ) as Record<StrawberryCategory, CategoryPriceInput>;

  for (const row of data ?? []) {
    values[row.categoria as StrawberryCategory] = {
      precoMin: Number(row.preco_min),
      precoMax: Number(row.preco_max),
    };
  }

  return values;
}
