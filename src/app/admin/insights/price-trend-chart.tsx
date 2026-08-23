"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type DefaultLegendContentProps,
  type LegendPayload,
  type TooltipContentProps,
} from "recharts";

import { STRAWBERRY_CATEGORIES, type StrawberryCategory } from "@/lib/validation/strawberry-price";
import type { TrendPoint } from "./trend-series";

// One line per category (DESIGN.md `card-content`: white, rounded-[24px], no
// border — canvas/canvas-soft contrast IS the elevation). Categorical colors
// come from the `dataviz` skill's documented default palette
// (references/palette.md), slots 1-4 in fixed order, assigned to
// STRAWBERRY_CATEGORIES in its own fixed order — never
// {colors.primary} (#9fe870), which DESIGN.md reserves exclusively for CTAs.
// Validated colorblind-safe with `validate_palette.js` on this exact 4-hex
// set for a line chart's adjacent-pairs check (worst adjacent CVD ΔE 9.1,
// normal-vision floor 22.9 — both clear the gates). Two of the four slots
// (aqua, yellow) sit under 3:1 contrast against the white card surface; the
// palette's own rule makes that legal only with a "relief" channel, which
// here is the always-on legend + tooltip below — identity is never carried
// by hue alone.
const CATEGORY_COLOR: Record<StrawberryCategory, string> = {
  Velho: "#2a78d6",
  Bom: "#eb6834",
  "Safra Nova Top": "#1baf7a",
  "Safra Nova Diferenciado": "#eda100",
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

// Custom tooltip: crosshair-driven readout of every category present at the
// hovered date (missing categories are simply absent, not zeroed). Values
// lead in weight; the series color rides a short line-key rather than a
// filled box, per the skill's tooltip anatomy.
function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const entries = payload.filter((entry) => typeof entry.value === "number");
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
            <span
              aria-hidden
              className="h-[2px] w-4 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
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

// Custom legend: line-shaped swatches (mirroring the Line mark itself) in
// text-body ink, never a colored box or colored text — identity rides the
// swatch, not the label.
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
          <span
            aria-hidden
            className="h-[2px] w-4 shrink-0 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.value}
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
          <XAxis
            dataKey="data"
            tickFormatter={formatAxisDate}
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
              stroke={CATEGORY_COLOR[category]}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 0, fill: CATEGORY_COLOR[category] }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--canvas)" }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
