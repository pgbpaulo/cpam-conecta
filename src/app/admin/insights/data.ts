import { createSupabaseServerClient } from "@/lib/supabase/server";
import { STRAWBERRY_CATEGORIES, type StrawberryCategory } from "@/lib/validation/strawberry-price";
import { rangeToDateInterval, type InsightsRange } from "./date-range";

// Matches Supabase's own default `db.max_rows` API cap, so pagination works
// correctly whether the project's cap is 1000 or higher.
const PAGE_SIZE = 1000;

export type PriceHistoryRow = {
  data: string;
  categoria: StrawberryCategory;
  precoMin: number;
  precoMax: number;
};

type RawRow = { data: string; categoria: string; preco_min: number; preco_max: number };

// Supabase caps a single `.select()` at `db.max_rows` (1000 by default). A
// single unpaginated query would silently truncate once the table crosses
// that many matching rows, so we page through with `.range()` until a page
// comes back shorter than PAGE_SIZE (meaning we've reached the end).
async function fetchAllPages<T>(
  fetchPage: (offset: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await fetchPage(offset);

    if (error) {
      throw new Error(error.message);
    }

    const page = data ?? [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return rows;
}

export async function getPriceHistory(
  range: InsightsRange,
  today: Date
): Promise<PriceHistoryRow[]> {
  const supabase = await createSupabaseServerClient();
  const { from, to } = rangeToDateInterval(range, today);

  let rows: RawRow[];
  try {
    rows = await fetchAllPages<RawRow>((offset) =>
      supabase
        .from("precos_morango")
        .select("data, categoria, preco_min, preco_max")
        .gte("data", from)
        .lte("data", to)
        .order("data", { ascending: true })
        .order("categoria", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1)
    );
  } catch (error) {
    throw new Error(
      `Falha ao buscar histórico de preços: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return rows.map((row) => ({
    data: row.data,
    categoria: row.categoria as StrawberryCategory,
    precoMin: Number(row.preco_min),
    precoMax: Number(row.preco_max),
  }));
}

export type AnnualAverage = {
  year: number;
  categoria: StrawberryCategory;
  average: number;
};

export async function getAnnualAverages(): Promise<AnnualAverage[]> {
  const supabase = await createSupabaseServerClient();

  let rows: RawRow[];
  try {
    rows = await fetchAllPages<RawRow>((offset) =>
      supabase
        .from("precos_morango")
        .select("data, categoria, preco_min, preco_max")
        .order("data", { ascending: true })
        .order("categoria", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1)
    );
  } catch (error) {
    throw new Error(
      `Falha ao buscar médias anuais: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const sums = new Map<
    string,
    { year: number; categoria: StrawberryCategory; total: number; count: number }
  >();

  for (const row of rows) {
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
