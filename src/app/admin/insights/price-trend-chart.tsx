"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Symbols,
  Tooltip,
  XAxis,
  YAxis,
  type SymbolType,
  type TooltipContentProps,
} from "recharts";

import { STRAWBERRY_CATEGORIES, type StrawberryCategory } from "@/lib/validation/strawberry-price";
import { STRAWBERRY_CATEGORY_COLOR } from "@/lib/strawberry-category-colors";
import type { TrendPoint } from "./trend-series";

// One line per category (DESIGN.md `card-content`: white, rounded-[24px], no
// border — canvas/canvas-soft contrast IS the elevation). Colors come from
// STRAWBERRY_CATEGORY_COLOR (see that module for the colorblind-safety
// rationale) — the same mapping the price-entry form uses, so a category
// reads as the same color everywhere in the app, not just here. Two of the
// four slots (aqua, yellow) sit under 3:1 contrast against the white card
// surface, and hue alone is a colorblind reader's only channel while
// scanning a live chart (the legend/tooltip text doesn't help distinguish
// two already-drawn lines at a glance). So every category also carries a
// distinct `strokeDasharray`, visible along the whole line — a continuous
// secondary encoding, per the skill's secondary-encoding allowance — and the
// legend swatch pairs that same dash with a distinct shape so the key stays
// learnable even without per-point markers drawn on the chart itself.
const LINE_STYLE: Record<StrawberryCategory, { dash?: string; shape: SymbolType }> = {
  Velho: { shape: "circle" }, // solid line
  Bom: { dash: "8 4", shape: "square" }, // dashed
  "Safra Nova Top": { dash: "1 4", shape: "diamond" }, // dotted
  "Safra Nova Diferenciado": { dash: "10 3 2 3", shape: "triangle" }, // dash-dot
};

const AXIS_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
});

const TOOLTIP_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const AXIS_CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function parseISODate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatAxisDate(isoDate: string): string {
  return AXIS_DATE_FORMATTER.format(parseISODate(isoDate));
}

function formatTooltipDate(isoDate: string): string {
  return TOOLTIP_DATE_FORMATTER.format(parseISODate(isoDate));
}

function formatCurrency(value: number): string {
  return CURRENCY_FORMATTER.format(value);
}

function makeActiveDot(category: StrawberryCategory) {
  const style = LINE_STYLE[category];
  const color = STRAWBERRY_CATEGORY_COLOR[category];

  return function CategoryActiveDot(props: { cx?: number; cy?: number }) {
    const { cx, cy } = props;
    if (cx == null || cy == null) {
      return null;
    }

    return (
      <Symbols
        cx={cx}
        cy={cy}
        type={style.shape}
        size={110}
        fill={color}
        stroke="var(--canvas)"
        strokeWidth={2}
      />
    );
  };
}

// A small dash + shape swatch shared by the legend and the tooltip, so the
// key a reader learns in either place matches the line on the chart, not
// just its color.
function LineKey({ category }: { category: StrawberryCategory }) {
  const style = LINE_STYLE[category];
  const color = STRAWBERRY_CATEGORY_COLOR[category];

  return (
    <svg width="28" height="12" viewBox="0 0 28 12" aria-hidden className="shrink-0">
      <line
        x1={0}
        y1={6}
        x2={28}
        y2={6}
        stroke={color}
        strokeWidth={2}
        strokeDasharray={style.dash}
        strokeLinecap="round"
      />
      <Symbols cx={14} cy={6} type={style.shape} size={40} fill={color} />
    </svg>
  );
}

// Custom tooltip: crosshair-driven readout of every category present at the
// hovered date (missing categories are simply absent, not zeroed). Values
// lead in weight; each row keys with the same dash + shape swatch used on
// the chart and in the legend, per the skill's tooltip anatomy.
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
      <p className="text-xs font-semibold text-mute">
        {formatTooltipDate(String(label))}
      </p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {entries.map((entry) => (
          <li key={String(entry.dataKey)} className="flex items-center gap-2.5 text-sm">
            <LineKey category={entry.name as StrawberryCategory} />
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

// Custom legend: the same dash + shape swatch as the chart lines and the
// tooltip (never a colored box or colored text) — identity rides the
// swatch, not the label. Built directly from STRAWBERRY_CATEGORIES rather
// than recharts' auto-generated `payload`: that payload does not reliably
// preserve the <Line> render order (it renders alphabetically in practice),
// which broke the "legend order matches in-chart bar order" accessibility
// guarantee this file's own comments above describe.
function ChartLegend() {
  return (
    <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
      {STRAWBERRY_CATEGORIES.map((category) => (
        <li key={category} className="flex items-center gap-2 text-sm text-body">
          <LineKey category={category} />
          {category}
        </li>
      ))}
    </ul>
  );
}

export function PriceTrendChart({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) {
    return (
      <section
        aria-label="Evolução do preço do morango"
        className="rounded-[24px] bg-canvas px-6 py-16 text-center"
      >
        <p className="text-base font-semibold text-ink">
          Nenhum lançamento no período selecionado
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-body">
          Escolha outro intervalo de datas ou registre preços em &quot;Lançar
          preço&quot; para ver a tendência aqui.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Evolução do preço do morango" className="rounded-[24px] bg-canvas p-6">
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--canvas-soft)" />
          {/* At 90 days or "Tudo", one tick per data point crowds into an
              unreadable row. `minTickGap` (in px, generous for a "DD/MM"
              label) makes recharts' own collision-avoidance skip enough
              ticks to fit — responsive to the actual rendered width, so it
              stays legible on mobile too, not just desktop. */}
          <XAxis
            dataKey="data"
            tickFormatter={formatAxisDate}
            tick={{ fill: "var(--mute)", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "var(--canvas-soft)" }}
            interval="preserveStartEnd"
            minTickGap={48}
          />
          <YAxis
            tickFormatter={(value: number) => AXIS_CURRENCY_FORMATTER.format(value)}
            tick={{ fill: "var(--mute)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip
            content={ChartTooltip}
            cursor={{ stroke: "var(--canvas-soft)", strokeWidth: 1 }}
          />
          <Legend content={ChartLegend} />
          {STRAWBERRY_CATEGORIES.map((category) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              name={category}
              stroke={STRAWBERRY_CATEGORY_COLOR[category]}
              strokeWidth={2}
              strokeDasharray={LINE_STYLE[category].dash}
              dot={false}
              activeDot={makeActiveDot(category)}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
