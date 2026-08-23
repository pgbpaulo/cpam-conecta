"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  type DefaultLegendContentProps,
  type LegendPayload,
  type TooltipContentProps,
} from "recharts";

import { STRAWBERRY_CATEGORIES, type StrawberryCategory } from "@/lib/validation/strawberry-price";
import type { AnnualSeriesPoint } from "./annual-series";

// One bar per category (DESIGN.md `card-content`: white, rounded-[24px], no
// border). Same categorical palette and category→color mapping as
// `price-trend-chart.tsx` (Task 6) — slots 1-4 of the `dataviz` skill's
// documented default palette, in `STRAWBERRY_CATEGORIES` order — reused
// verbatim so the two charts on this page read as one system. Never
// {colors.primary} (#9fe870), which DESIGN.md reserves exclusively for CTAs.
const BAR_COLOR: Record<StrawberryCategory, string> = {
  Velho: "#2a78d6",
  Bom: "#eb6834",
  "Safra Nova Top": "#1baf7a",
  "Safra Nova Diferenciado": "#eda100",
};

// Accessibility call (deliberately made, not skipped): Task 6's line chart
// needed strokeDasharray + marker shape as a secondary encoding because its
// four lines overlap in one shared plot area — hue was the ONLY channel
// separating them, and the dataviz skill's CVD floor treats that as failing
// without a secondary encoding. A grouped bar chart doesn't share that
// failure mode: each category owns a fixed slot inside every year-group (the
// `STRAWBERRY_CATEGORIES` order below never changes), so position is itself
// a second, always-on identity channel — "3rd bar in every group is Safra
// Nova Top" holds regardless of whether a reader can distinguish blue from
// orange. That position channel plus the always-present legend (itself
// ordered to match the in-chart bar order) and a fully text-labeled tooltip
// (category name + formatted value on every row, never color-only) already
// clears the skill's "identity never rides color alone" bar. Per
// `references/marks-and-anatomy.md`, hatch/texture fill is documented as an
// *opt-in* backup channel for full-severity CVD, print, or forced-colors —
// never on by default — so no pattern fill is added here; the plain 4-color
// fill is sufficient given position is already load-bearing.
const CATEGORY_ORDER: StrawberryCategory[] = [...STRAWBERRY_CATEGORIES];

const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const AXIS_CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number): string {
  return CURRENCY_FORMATTER.format(value);
}

// A small swatch shared by the legend and the tooltip — a filled rounded
// rect, mirroring the bar mark itself (per `interaction.md`: "legends still
// mirror the mark: rect for bars/areas, line for lines").
function CategorySwatch({ category }: { category: StrawberryCategory }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="shrink-0">
      <rect width="12" height="12" rx="3" fill={BAR_COLOR[category]} />
    </svg>
  );
}

// Custom tooltip: every category present in the hovered year's group, values
// leading in weight, formatted in reais. Categories absent that year are
// simply absent from the list, never shown as zero.
function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const entries = payload.filter(
    (entry) => typeof entry.value === "number" && entry.name != null
  );
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[12px] bg-canvas px-4 py-3 shadow-lg ring-1 ring-ink/10">
      <p className="text-xs font-semibold text-mute">{String(label)}</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {entries.map((entry) => (
          <li key={String(entry.dataKey)} className="flex items-center gap-2.5 text-sm">
            <CategorySwatch category={entry.name as StrawberryCategory} />
            <span className="text-body">{String(entry.name)}</span>
            <span className="ml-auto pl-3 font-semibold text-ink">
              {formatCurrency(entry.value as number)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Custom legend: same swatch as the tooltip, ordered to match the in-chart
// bar order so "position in the legend" and "position in the group" agree —
// that agreement is part of the accessibility argument above.
function ChartLegend({ payload }: DefaultLegendContentProps) {
  const entries = (payload ?? []) as LegendPayload[];
  if (entries.length === 0) {
    return null;
  }

  return (
    <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
      {entries.map((entry) => (
        <li
          key={String(entry.dataKey ?? entry.value)}
          className="flex items-center gap-2 text-sm text-body"
        >
          <CategorySwatch category={entry.value as StrawberryCategory} />
          {entry.value}
        </li>
      ))}
    </ul>
  );
}

export function AnnualAveragesChart({ points }: { points: AnnualSeriesPoint[] }) {
  if (points.length === 0) {
    return (
      <section
        aria-label="Média anual do preço do morango"
        className="rounded-[24px] bg-canvas px-6 py-16 text-center"
      >
        <p className="text-base font-semibold text-ink">Nenhum histórico anual disponível</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-body">
          Registre preços em &quot;Lançar preço&quot; ao longo do ano para ver a
          comparação de médias anuais aqui.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Média anual do preço do morango" className="rounded-[24px] bg-canvas p-6">
      <ResponsiveContainer width="100%" height={360}>
        <BarChart
          data={points}
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          barGap={2}
          barCategoryGap="20%"
        >
          <CartesianGrid vertical={false} stroke="var(--canvas-soft)" />
          <XAxis
            dataKey="year"
            tick={{ fill: "var(--mute)", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "var(--canvas-soft)" }}
          />
          <YAxis
            tickFormatter={(value: number) => AXIS_CURRENCY_FORMATTER.format(value)}
            tick={{ fill: "var(--mute)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip content={ChartTooltip} cursor={{ fill: "var(--canvas-soft)" }} />
          <Legend content={ChartLegend} />
          {CATEGORY_ORDER.map((category) => (
            <Bar
              key={category}
              dataKey={category}
              name={category}
              fill={BAR_COLOR[category]}
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
