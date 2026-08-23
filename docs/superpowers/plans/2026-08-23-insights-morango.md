# Módulo de Insights de Preço do Morango — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/admin/insights` page: a period-filterable price trend chart, period summary stat cards, and a per-category annual averages chart, all reading the existing `precos_morango` data.

**Architecture:** Next.js App Router, Server Component page fetching and aggregating data server-side (mirrors `/admin/lancar-preco`); Recharts-based chart components run as Client Components (`"use client"`) since Recharts needs the browser to render/measure SVG. All aggregation (date-range mapping, series pivoting, summary stats) is pure TypeScript, tested independently of Supabase.

**Tech Stack:** Next.js (App Router) + TypeScript, Tailwind v4, Supabase (`@supabase/supabase-js` via the existing `createSupabaseServerClient`), Recharts (new dependency), Vitest, npm.

**Spec:** [docs/superpowers/specs/2026-08-23-insights-morango-design.md](../specs/2026-08-23-insights-morango-design.md)

## Global Constraints

- UI copy (labels, messages, empty states) is pt-BR. Code identifiers, file names, comments, and commit messages are en-US. DB field/value names stay pt-BR (`precos_morango`, `categoria`, `preco_min`, `preco_max`) — matches the pre-existing schema.
- Package manager: npm only.
- Every commit is made on the `dev` branch and pushed. Never commit or push to `main` — that only happens on an explicit later request from the user.
- Any UI/UX creation (layout, hierarchy, copy placement, empty states) is produced by invoking the `impeccable` skill — never hand-authored by the executor's own judgment. Any chart-specific visual decision (series color, axis, tooltip, legend, mark form) is produced by invoking the `dataviz` skill first, per its own trigger rule for "any chart, in any output medium, including Recharts." Tasks that touch a visual file say so explicitly and give the exact contract (props/types) the skill output must satisfy. `page.tsx` composition and pure data/calculation files are hand-authored — they are plumbing, not UI/UX judgment calls.
- This module is read-only: no new Supabase migration, no new RLS policy, no writes to `precos_morango`.
- TDD with Vitest applies to all pure logic and to any data-access function that talks to Supabase (via a mocked client, following the existing pattern in `src/app/admin/lancar-preco/data.test.ts`). No E2E tests in this plan.
- Colors used for the 4 category series in both charts must come from the `dataviz` skill's categorical guidance and must NOT reuse `{colors.primary}` (`#9fe870`) — DESIGN.md reserves that lime-green exclusively for primary CTAs and the nav active indicator.

---

### Task 1: Insights date-range utility (TDD)

**Files:**
- Create: `src/app/admin/insights/date-range.ts`
- Test: `src/app/admin/insights/date-range.test.ts`

**Interfaces:**
- Consumes: `toISODate` (from `@/lib/recent-days`, already exists)
- Produces: `INSIGHTS_RANGES`, `InsightsRange`, `rangeToDateInterval(range: InsightsRange, today: Date): { from: string; to: string }` — used by Task 2 and Task 9

- [ ] **Step 1: Write the failing tests**

```ts
// src/app/admin/insights/date-range.test.ts
import { describe, expect, it } from "vitest";
import { rangeToDateInterval } from "./date-range";

describe("rangeToDateInterval", () => {
  const today = new Date("2026-08-23T12:00:00");

  it("returns a 30-day window ending today", () => {
    expect(rangeToDateInterval("30d", today)).toEqual({
      from: "2026-07-25",
      to: "2026-08-23",
    });
  });

  it("returns a 90-day window ending today", () => {
    expect(rangeToDateInterval("90d", today)).toEqual({
      from: "2026-05-26",
      to: "2026-08-23",
    });
  });

  it("returns the current calendar year for 'ano'", () => {
    expect(rangeToDateInterval("ano", today)).toEqual({
      from: "2026-01-01",
      to: "2026-08-23",
    });
  });

  it("returns a sentinel start date for 'tudo'", () => {
    expect(rangeToDateInterval("tudo", today)).toEqual({
      from: "1900-01-01",
      to: "2026-08-23",
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/app/admin/insights/date-range.test.ts`
Expected: FAIL — `date-range.ts` does not exist yet.

- [ ] **Step 3: Implement the utility**

```ts
// src/app/admin/insights/date-range.ts
import { toISODate } from "@/lib/recent-days";

export const INSIGHTS_RANGES = ["30d", "90d", "ano", "tudo"] as const;
export type InsightsRange = (typeof INSIGHTS_RANGES)[number];

// Predates any real lançamento — used as an unbounded lower limit for
// "tudo" so the query code path never needs a conditional filter.
const HISTORY_START = "1900-01-01";

export function rangeToDateInterval(
  range: InsightsRange,
  today: Date
): { from: string; to: string } {
  const to = toISODate(today);

  if (range === "tudo") {
    return { from: HISTORY_START, to };
  }

  if (range === "ano") {
    const yearStart = new Date(today.getFullYear(), 0, 1);
    return { from: toISODate(yearStart), to };
  }

  const days = range === "30d" ? 30 : 90;
  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));
  return { from: toISODate(from), to };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/app/admin/insights/date-range.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit and push**

```bash
git add src/app/admin/insights/date-range.ts src/app/admin/insights/date-range.test.ts
git commit -m "feat: add insights date-range utility"
git push
```

---

### Task 2: Insights data-access functions (TDD)

**Files:**
- Create: `src/app/admin/insights/data.ts`
- Test: `src/app/admin/insights/data.test.ts`

**Interfaces:**
- Consumes: `createSupabaseServerClient` (from `@/lib/supabase/server`), `STRAWBERRY_CATEGORIES`/`StrawberryCategory` (from `@/lib/validation/strawberry-price`), `rangeToDateInterval`/`InsightsRange` (Task 1)
- Produces: `PriceHistoryRow`, `getPriceHistory(range: InsightsRange, today: Date): Promise<PriceHistoryRow[]>`, `AnnualAverage`, `getAnnualAverages(): Promise<AnnualAverage[]>` — used by Task 3, Task 4, Task 9

- [ ] **Step 1: Write the failing tests**

```ts
// src/app/admin/insights/data.test.ts
import { describe, expect, it, vi, beforeEach } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({ from: fromMock }),
}));

import { getPriceHistory, getAnnualAverages } from "./data";

function historyBuilder(result: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    order: vi.fn(() => Promise.resolve(result)),
  };
  return builder;
}

function allRowsBuilder(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn(() => Promise.resolve(result)),
  };
}

describe("getPriceHistory", () => {
  beforeEach(() => fromMock.mockReset());

  it("maps rows returned for the selected range", async () => {
    fromMock.mockReturnValue(
      historyBuilder({
        data: [{ data: "2026-08-20", categoria: "Bom", preco_min: 8, preco_max: 10 }],
        error: null,
      })
    );

    const rows = await getPriceHistory("30d", new Date("2026-08-23T12:00:00"));

    expect(fromMock).toHaveBeenCalledWith("precos_morango");
    expect(rows).toEqual([
      { data: "2026-08-20", categoria: "Bom", precoMin: 8, precoMax: 10 },
    ]);
  });

  it("throws when Supabase returns an error", async () => {
    fromMock.mockReturnValue(historyBuilder({ data: null, error: { message: "boom" } }));

    await expect(getPriceHistory("30d", new Date("2026-08-23T12:00:00"))).rejects.toThrow(
      "Falha ao buscar histórico de preços"
    );
  });
});

describe("getAnnualAverages", () => {
  beforeEach(() => fromMock.mockReset());

  it("averages (min+max)/2 grouped by year and category", async () => {
    fromMock.mockReturnValue(
      allRowsBuilder({
        data: [
          { data: "2025-03-10", categoria: "Bom", preco_min: 8, preco_max: 10 },
          { data: "2025-06-01", categoria: "Bom", preco_min: 10, preco_max: 14 },
          { data: "2026-01-15", categoria: "Bom", preco_min: 6, preco_max: 8 },
        ],
        error: null,
      })
    );

    const averages = await getAnnualAverages();

    expect(averages).toEqual([
      { year: 2025, categoria: "Bom", average: 10.5 },
      { year: 2026, categoria: "Bom", average: 7 },
    ]);
  });

  it("throws when Supabase returns an error", async () => {
    fromMock.mockReturnValue(allRowsBuilder({ data: null, error: { message: "boom" } }));

    await expect(getAnnualAverages()).rejects.toThrow("Falha ao buscar médias anuais");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/app/admin/insights/data.test.ts`
Expected: FAIL — `data.ts` does not exist yet.

- [ ] **Step 3: Implement the data-access functions**

```ts
// src/app/admin/insights/data.ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/app/admin/insights/data.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit and push**

```bash
git add src/app/admin/insights/data.ts src/app/admin/insights/data.test.ts
git commit -m "feat: add insights data-access functions"
git push
```

---

### Task 3: Chart series pure calculations (TDD)

**Files:**
- Create: `src/app/admin/insights/trend-series.ts`
- Create: `src/app/admin/insights/annual-series.ts`
- Test: `src/app/admin/insights/trend-series.test.ts`
- Test: `src/app/admin/insights/annual-series.test.ts`

**Interfaces:**
- Consumes: `PriceHistoryRow` and `AnnualAverage` (Task 2), `StrawberryCategory` (from `@/lib/validation/strawberry-price`)
- Produces: `TrendPoint`, `buildTrendSeries(rows: PriceHistoryRow[]): TrendPoint[]`, `AnnualSeriesPoint`, `buildAnnualSeries(averages: AnnualAverage[]): AnnualSeriesPoint[]` — used by Task 6, Task 7, Task 9

- [ ] **Step 1: Write the failing tests**

```ts
// src/app/admin/insights/trend-series.test.ts
import { describe, expect, it } from "vitest";
import { buildTrendSeries } from "./trend-series";
import type { PriceHistoryRow } from "./data";

describe("buildTrendSeries", () => {
  it("groups rows by date with one field per category, averaging min/max", () => {
    const rows: PriceHistoryRow[] = [
      { data: "2026-08-20", categoria: "Bom", precoMin: 8, precoMax: 10 },
      { data: "2026-08-20", categoria: "Velho", precoMin: 4, precoMax: 6 },
      { data: "2026-08-21", categoria: "Bom", precoMin: 9, precoMax: 11 },
    ];

    expect(buildTrendSeries(rows)).toEqual([
      { data: "2026-08-20", Bom: 9, Velho: 5 },
      { data: "2026-08-21", Bom: 10 },
    ]);
  });

  it("returns an empty array for no rows", () => {
    expect(buildTrendSeries([])).toEqual([]);
  });
});
```

```ts
// src/app/admin/insights/annual-series.test.ts
import { describe, expect, it } from "vitest";
import { buildAnnualSeries } from "./annual-series";
import type { AnnualAverage } from "./data";

describe("buildAnnualSeries", () => {
  it("groups averages by year with one field per category", () => {
    const averages: AnnualAverage[] = [
      { year: 2025, categoria: "Bom", average: 10.5 },
      { year: 2025, categoria: "Velho", average: 6 },
      { year: 2026, categoria: "Bom", average: 7 },
    ];

    expect(buildAnnualSeries(averages)).toEqual([
      { year: 2025, Bom: 10.5, Velho: 6 },
      { year: 2026, Bom: 7 },
    ]);
  });

  it("returns an empty array for no averages", () => {
    expect(buildAnnualSeries([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/app/admin/insights/trend-series.test.ts src/app/admin/insights/annual-series.test.ts`
Expected: FAIL — neither file exists yet.

- [ ] **Step 3: Implement both pure functions**

```ts
// src/app/admin/insights/trend-series.ts
import type { StrawberryCategory } from "@/lib/validation/strawberry-price";
import type { PriceHistoryRow } from "./data";

export type TrendPoint = { data: string } & Partial<Record<StrawberryCategory, number>>;

export function buildTrendSeries(rows: PriceHistoryRow[]): TrendPoint[] {
  const byDate = new Map<string, TrendPoint>();

  for (const row of rows) {
    const point = byDate.get(row.data) ?? { data: row.data };
    point[row.categoria] = Math.round(((row.precoMin + row.precoMax) / 2) * 100) / 100;
    byDate.set(row.data, point);
  }

  return Array.from(byDate.values()).sort((a, b) => a.data.localeCompare(b.data));
}
```

```ts
// src/app/admin/insights/annual-series.ts
import type { StrawberryCategory } from "@/lib/validation/strawberry-price";
import type { AnnualAverage } from "./data";

export type AnnualSeriesPoint = { year: number } & Partial<Record<StrawberryCategory, number>>;

export function buildAnnualSeries(averages: AnnualAverage[]): AnnualSeriesPoint[] {
  const byYear = new Map<number, AnnualSeriesPoint>();

  for (const entry of averages) {
    const point = byYear.get(entry.year) ?? { year: entry.year };
    point[entry.categoria] = entry.average;
    byYear.set(entry.year, point);
  }

  return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/app/admin/insights/trend-series.test.ts src/app/admin/insights/annual-series.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit and push**

```bash
git add src/app/admin/insights/trend-series.ts src/app/admin/insights/trend-series.test.ts src/app/admin/insights/annual-series.ts src/app/admin/insights/annual-series.test.ts
git commit -m "feat: add insights chart series calculations"
git push
```

---

### Task 4: Summary stats pure calculation (TDD)

**Files:**
- Create: `src/app/admin/insights/summary.ts`
- Test: `src/app/admin/insights/summary.test.ts`

**Interfaces:**
- Consumes: `PriceHistoryRow` (Task 2), `StrawberryCategory` (from `@/lib/validation/strawberry-price`)
- Produces: `SummaryStats`, `computeSummaryStats(rows: PriceHistoryRow[]): SummaryStats | null` — used by Task 5, Task 9

- [ ] **Step 1: Write the failing tests**

```ts
// src/app/admin/insights/summary.test.ts
import { describe, expect, it } from "vitest";
import { computeSummaryStats } from "./summary";
import type { PriceHistoryRow } from "./data";

describe("computeSummaryStats", () => {
  it("returns null for an empty period", () => {
    expect(computeSummaryStats([])).toBeNull();
  });

  it("computes average, highest, lowest, and latest entries", () => {
    const rows: PriceHistoryRow[] = [
      { data: "2026-08-20", categoria: "Bom", precoMin: 8, precoMax: 10 },
      { data: "2026-08-21", categoria: "Velho", precoMin: 4, precoMax: 6 },
      { data: "2026-08-21", categoria: "Bom", precoMin: 9, precoMax: 13 },
    ];

    const stats = computeSummaryStats(rows);

    expect(stats?.average).toBe(8.33);
    expect(stats?.highest).toEqual({ precoMax: 13, data: "2026-08-21", categoria: "Bom" });
    expect(stats?.lowest).toEqual({ precoMin: 4, data: "2026-08-21", categoria: "Velho" });
    expect(stats?.latest).toEqual({
      data: "2026-08-21",
      entries: [
        { categoria: "Velho", precoMin: 4, precoMax: 6 },
        { categoria: "Bom", precoMin: 9, precoMax: 13 },
      ],
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/app/admin/insights/summary.test.ts`
Expected: FAIL — `summary.ts` does not exist yet.

- [ ] **Step 3: Implement the calculation**

```ts
// src/app/admin/insights/summary.ts
import type { StrawberryCategory } from "@/lib/validation/strawberry-price";
import type { PriceHistoryRow } from "./data";

export type SummaryStats = {
  average: number;
  highest: { precoMax: number; data: string; categoria: StrawberryCategory };
  lowest: { precoMin: number; data: string; categoria: StrawberryCategory };
  latest: {
    data: string;
    entries: { categoria: StrawberryCategory; precoMin: number; precoMax: number }[];
  };
};

export function computeSummaryStats(rows: PriceHistoryRow[]): SummaryStats | null {
  if (rows.length === 0) {
    return null;
  }

  const representativeSum = rows.reduce(
    (sum, row) => sum + (row.precoMin + row.precoMax) / 2,
    0
  );
  const average = Math.round((representativeSum / rows.length) * 100) / 100;

  const highest = rows.reduce((best, row) => (row.precoMax > best.precoMax ? row : best));
  const lowest = rows.reduce((best, row) => (row.precoMin < best.precoMin ? row : best));

  const latestDate = rows.reduce((max, row) => (row.data > max ? row.data : max), rows[0].data);
  const latestEntries = rows
    .filter((row) => row.data === latestDate)
    .map((row) => ({ categoria: row.categoria, precoMin: row.precoMin, precoMax: row.precoMax }));

  return {
    average,
    highest: { precoMax: highest.precoMax, data: highest.data, categoria: highest.categoria },
    lowest: { precoMin: lowest.precoMin, data: lowest.data, categoria: lowest.categoria },
    latest: { data: latestDate, entries: latestEntries },
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/app/admin/insights/summary.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit and push**

```bash
git add src/app/admin/insights/summary.ts src/app/admin/insights/summary.test.ts
git commit -m "feat: add insights summary stats calculation"
git push
```

---

### Task 5: Summary stats cards UI (via impeccable)

**Files:**
- Create: `src/app/admin/insights/summary-stats.tsx`

**Interfaces:**
- Consumes: `SummaryStats` (Task 4)
- Produces: `SummaryStats({ stats }: { stats: SummaryStats | null })` (server component) — used by Task 9

- [ ] **Step 1: Invoke `impeccable` to design and build the summary cards**

Invoke the `impeccable` skill with this brief:

> Componente `src/app/admin/insights/summary-stats.tsx`, server component, props `{ stats: SummaryStats | null }` (`SummaryStats` importado de `./summary`: `{ average: number; highest: { precoMax: number; data: string; categoria: StrawberryCategory }; lowest: { precoMin: number; data: string; categoria: StrawberryCategory }; latest: { data: string; entries: { categoria: StrawberryCategory; precoMin: number; precoMax: number }[] } }`, `StrawberryCategory` de `@/lib/validation/strawberry-price`, `data` sempre `YYYY-MM-DD`, valores em reais). Contexto: dono do Ceasinha do Morango olha essa área no topo da página de insights (`/admin/insights`) pra ter um resumo rápido do período selecionado, no celular ou desktop. Requisitos funcionais:
> 1. Quando `stats` é `null` (nenhum lançamento no período selecionado), mostrar um estado vazio explicando que não há dados nesse período — sem números zerados.
> 2. Quando `stats` existe, mostrar 4 métricas: preço médio do período (`stats.average`), maior alta (`stats.highest.precoMax`, com sua categoria e data), menor preço (`stats.lowest.precoMin`, com sua categoria e data), último lançamento (`stats.latest.data`, listando cada item de `stats.latest.entries` com categoria, min e max).
> 3. Valores monetários formatados em reais (pt-BR, ex: `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`). Datas formatadas de forma amigável em pt-BR.
> 4. Usa os cards do DESIGN.md (`card-content`/`card-feature-*`, `rounded-[24px]`, sem borda — a paleta sage/branco já usada no resto do admin).
> 5. Todo texto visível em pt-BR.

- [ ] **Step 2: Verify types and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 3: Commit and push**

```bash
git add src/app/admin/insights/summary-stats.tsx
git commit -m "feat: add insights summary stats UI"
git push
```

---

### Task 6: Price trend chart UI (via dataviz)

**Files:**
- Modify: `package.json` (add `recharts` dependency)
- Create: `src/app/admin/insights/price-trend-chart.tsx`

**Interfaces:**
- Consumes: `TrendPoint` (Task 3), `STRAWBERRY_CATEGORIES`/`StrawberryCategory` (from `@/lib/validation/strawberry-price`)
- Produces: `PriceTrendChart({ points }: { points: TrendPoint[] })` (client component) — used by Task 9

- [ ] **Step 1: Install Recharts**

```bash
npm install recharts
```

- [ ] **Step 2: Invoke `dataviz` to design and build the trend line chart**

Invoke the `dataviz` skill with this brief:

> Componente `src/app/admin/insights/price-trend-chart.tsx`, client component (`"use client"`), props `{ points: TrendPoint[] }` (`TrendPoint` importado de `./trend-series`: `{ data: string } & Partial<Record<StrawberryCategory, number>>`, uma entrada por data já ordenada crescente, `STRAWBERRY_CATEGORIES` de `@/lib/validation/strawberry-price` = `["Velho", "Bom", "Safra Nova Top", "Safra Nova Diferenciado"]`, cada campo de categoria é opcional — nem toda categoria tem cotação em toda data — e representa o preço médio em reais). Contexto: dono do Ceasinha do Morango acompanha, num gráfico de linha (Recharts `LineChart`), a evolução do preço do morango no período selecionado, uma linha por categoria, pra identificar tendência de alta/baixa. Requisitos funcionais:
> 1. Uma `Line` do Recharts por categoria em `STRAWBERRY_CATEGORIES`, com `connectNulls={false}` (dias sem lançamento daquela categoria aparecem como lacuna, não como zero).
> 2. Eixo X = `data` formatada de forma amigável em pt-BR; eixo Y = preço em reais.
> 3. Legenda identificando cada categoria; tooltip ao passar o mouse/toque mostrando a data e o valor de cada categoria presente naquele ponto, formatado em reais (pt-BR).
> 4. Estado vazio quando `points.length === 0` (nenhum lançamento no período selecionado) — sem renderizar um gráfico vazio.
> 5. Paleta categórica das 4 linhas: NÃO usar `{colors.primary}` (`#9fe870`, o lime-green do DESIGN.md) — essa cor é reservada para CTAs. Escolha 4 cores distinguíveis (inclusive por daltônicos) seguindo a metodologia da própria skill `dataviz`.
> 6. Container do gráfico segue o card branco `rounded-[24px]` do DESIGN.md, mesma linguagem visual do resto do admin.
> 7. Todo texto visível (eixos, legenda, tooltip, estado vazio) em pt-BR.

- [ ] **Step 3: Verify types and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 4: Commit and push**

```bash
git add package.json package-lock.json src/app/admin/insights/price-trend-chart.tsx
git commit -m "feat: add price trend chart UI"
git push
```

---

### Task 7: Annual averages chart UI (via dataviz)

**Files:**
- Create: `src/app/admin/insights/annual-averages-chart.tsx`

**Interfaces:**
- Consumes: `AnnualSeriesPoint` (Task 3), `STRAWBERRY_CATEGORIES`/`StrawberryCategory` (from `@/lib/validation/strawberry-price`), `recharts` (Task 6)
- Produces: `AnnualAveragesChart({ points }: { points: AnnualSeriesPoint[] })` (client component) — used by Task 9

- [ ] **Step 1: Invoke `dataviz` to design and build the annual averages bar chart**

Invoke the `dataviz` skill with this brief:

> Componente `src/app/admin/insights/annual-averages-chart.tsx`, client component (`"use client"`), props `{ points: AnnualSeriesPoint[] }` (`AnnualSeriesPoint` importado de `./annual-series`: `{ year: number } & Partial<Record<StrawberryCategory, number>>`, uma entrada por ano já ordenada crescente, `STRAWBERRY_CATEGORIES` de `@/lib/validation/strawberry-price`, cada campo de categoria é opcional — nem toda categoria tem histórico em todo ano — e representa o preço médio anual em reais). Contexto: mesma página de insights, mas este gráfico independe do filtro de período — sempre mostra todos os anos com dado histórico, pra comparar como a média de cada categoria evoluiu ano a ano. Requisitos funcionais:
> 1. Gráfico de barras (Recharts `BarChart`), eixo X = `year`, uma barra por categoria presente naquele ano, agrupadas lado a lado (não empilhadas) por ano.
> 2. Legenda identificando cada categoria; tooltip mostrando o ano e o valor de cada categoria, formatado em reais (pt-BR, `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`).
> 3. Estado vazio quando `points.length === 0`.
> 4. Mesma paleta categórica das 4 categorias definida no `price-trend-chart.tsx` (Task 6) — reutilize as mesmas cores/mapeamento categoria→cor pra manter consistência visual entre os dois gráficos da página. Continua proibido usar `{colors.primary}` do DESIGN.md.
> 5. Container do gráfico segue o card branco `rounded-[24px]` do DESIGN.md.
> 6. Todo texto visível em pt-BR.

- [ ] **Step 2: Verify types and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 3: Commit and push**

```bash
git add src/app/admin/insights/annual-averages-chart.tsx
git commit -m "feat: add annual averages chart UI"
git push
```

---

### Task 8: Period filter UI (via impeccable)

**Files:**
- Create: `src/app/admin/insights/period-filter.tsx`

**Interfaces:**
- Consumes: `INSIGHTS_RANGES`/`InsightsRange` (Task 1)
- Produces: `PeriodFilter({ current }: { current: InsightsRange })` (server component) — used by Task 9

- [ ] **Step 1: Invoke `impeccable` to design and build the period filter**

Invoke the `impeccable` skill with this brief:

> Componente `src/app/admin/insights/period-filter.tsx`, server component, props `{ current: InsightsRange }` (`InsightsRange`/`INSIGHTS_RANGES` importados de `./date-range`: `INSIGHTS_RANGES = ["30d", "90d", "ano", "tudo"] as const`). Contexto: no topo da página de insights (`/admin/insights`), controla o período do gráfico de evolução e dos cards de resumo (não afeta o gráfico de médias anuais, que sempre mostra tudo). Requisitos funcionais:
> 1. 4 opções, cada uma um link de navegação (`next/link`, funciona sem depender de JS/hidratação) para `/admin/insights?range=X`, com `X` sendo cada valor de `INSIGHTS_RANGES`.
> 2. Rótulos em pt-BR: `30d` → "30 dias", `90d` → "90 dias", `ano` → "Este ano", `tudo` → "Tudo".
> 3. Indicar visualmente com clareza qual opção corresponde a `current` (selecionada).
> 4. Estilo consistente com o resto da navegação do admin (ver `src/app/admin/nav-link.tsx` como referência de padrão de link ativo/inativo do DESIGN.md, mas este é um controle de filtro, não item de menu principal).

- [ ] **Step 2: Verify types and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 3: Commit and push**

```bash
git add src/app/admin/insights/period-filter.tsx
git commit -m "feat: add insights period filter UI"
git push
```

---

### Task 9: Wire the insights page together

**Files:**
- Create: `src/app/admin/insights/page.tsx`
- Modify: `src/app/admin/layout.tsx:15-17` (`NAV_ITEMS`)

**Interfaces:**
- Consumes: `getPriceHistory`/`getAnnualAverages` (Task 2), `buildTrendSeries` (Task 3), `buildAnnualSeries` (Task 3), `computeSummaryStats` (Task 4), `SummaryStats` component (Task 5), `PriceTrendChart` (Task 6), `AnnualAveragesChart` (Task 7), `PeriodFilter` (Task 8), `INSIGHTS_RANGES`/`InsightsRange` (Task 1), `todayInSaoPaulo` (from `@/lib/recent-days`)
- Produces: the finished `/admin/insights` route, reachable from the admin nav

- [ ] **Step 1: Implement the page**

```tsx
// src/app/admin/insights/page.tsx
import { getPriceHistory, getAnnualAverages } from "./data";
import { buildTrendSeries } from "./trend-series";
import { buildAnnualSeries } from "./annual-series";
import { computeSummaryStats } from "./summary";
import { INSIGHTS_RANGES, type InsightsRange } from "./date-range";
import { PeriodFilter } from "./period-filter";
import { SummaryStats } from "./summary-stats";
import { PriceTrendChart } from "./price-trend-chart";
import { AnnualAveragesChart } from "./annual-averages-chart";
import { todayInSaoPaulo } from "@/lib/recent-days";

const DEFAULT_RANGE: InsightsRange = "90d";

function parseRange(value: string | undefined): InsightsRange {
  return (INSIGHTS_RANGES as readonly string[]).includes(value ?? "")
    ? (value as InsightsRange)
    : DEFAULT_RANGE;
}

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = parseRange(params.range);
  const today = todayInSaoPaulo();

  const [historyRows, annualAverages] = await Promise.all([
    getPriceHistory(range, today),
    getAnnualAverages(),
  ]);

  const trendPoints = buildTrendSeries(historyRows);
  const annualPoints = buildAnnualSeries(annualAverages);
  const stats = computeSummaryStats(historyRows);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-8 pb-16 lg:max-w-5xl lg:px-10 lg:py-10">
      <h1 className="text-[40px] leading-[34px] font-black text-ink lg:pb-2">Insights</h1>

      <PeriodFilter current={range} />

      <SummaryStats stats={stats} />

      <div className="rounded-[24px] bg-canvas p-6 lg:p-8">
        <PriceTrendChart points={trendPoints} />
      </div>

      <div className="rounded-[24px] bg-canvas p-6 lg:p-8">
        <AnnualAveragesChart points={annualPoints} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the nav item**

```tsx
// src/app/admin/layout.tsx
const NAV_ITEMS = [
  { href: "/admin/lancar-preco", label: "Lançar Preço" },
  { href: "/admin/insights", label: "Insights" },
] as const;
```

- [ ] **Step 3: Run the full test suite and build**

```bash
npm run test
npx tsc --noEmit
npm run build
```

Expected: all tests pass, no type errors, build succeeds.

- [ ] **Step 4: Commit and push**

```bash
git add src/app/admin/insights/page.tsx src/app/admin/layout.tsx
git commit -m "feat: wire insights page together"
git push
```

- [ ] **Step 5: Manual verification note**

This plan verifies with `npm run build` / `npx tsc --noEmit` / `npm run test` only, since there's no live Supabase project connected in this environment. Once run against the real `precos_morango` data (`npm run dev`), walk through `/admin/insights`: switch each period filter option, confirm the trend chart and summary cards update, confirm the annual averages chart stays constant across filter changes, and confirm the empty state appears for a period with no lançamentos.

---

## Self-Review Notes

- **Spec coverage:** period filter + querystring state (Task 1, Task 8, Task 9), price trend chart (Task 2, Task 3, Task 6), summary stats cards (Task 2, Task 4, Task 5), annual averages chart (Task 2, Task 3, Task 7), nav entry (Task 9), empty states (Tasks 5/6/7 briefs), testing strategy (TDD Tasks 1–4, no E2E) — every spec section has a task.
- **Placeholder scan:** every step has literal code, commands, or a fully-specified `impeccable`/`dataviz` brief; no "TBD"/"add appropriate handling" left in.
- **Type consistency:** `PriceHistoryRow`, `AnnualAverage`, `TrendPoint`, `AnnualSeriesPoint`, `SummaryStats`, `InsightsRange`/`INSIGHTS_RANGES` are each defined once (Tasks 1, 2, 3, 4) and referenced identically by every consuming task, including the two skill-brief tasks (5, 6, 7, 8) and the final wiring task (9).
