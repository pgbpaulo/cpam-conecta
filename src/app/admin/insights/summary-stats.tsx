import { CalendarDays, Coins, TrendingDown, TrendingUp } from "lucide-react";

import type { SummaryStats } from "./summary";

// The insights page's summary strip — four cards drawn from DESIGN.md's
// card-content / card-feature-* vocabulary (white/sage/pale-green, no
// border, rounded-[24px]). The average card carries the soft-green feature
// treatment as the headline figure; highest/lowest are twin white
// card-content facts (neither reads as "good" or "bad", so neither borrows
// the positive/negative palette); the latest-day card breaks from the
// single-number shape into a short list, since "last launch" is inherently
// multi-entry, not a scalar.
const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function parseISODate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatCurrency(value: number): string {
  return CURRENCY_FORMATTER.format(value);
}

function formatDate(isoDate: string): string {
  return DATE_FORMATTER.format(parseISODate(isoDate));
}

export function SummaryStats({ stats }: { stats: SummaryStats | null }) {
  if (!stats) {
    return (
      <section
        aria-label="Resumo de preços do período"
        className="rounded-[24px] bg-canvas-soft px-6 py-12 text-center sm:px-10"
      >
        <p className="text-base font-semibold text-ink">
          Nenhum lançamento neste período
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-body">
          Escolha outro intervalo de datas ou registre preços em &quot;Lançar
          preço&quot; para ver o resumo aqui.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Resumo de preços do período"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="rounded-[24px] bg-primary-pale p-6">
        <div className="flex items-center gap-2 text-body">
          <Coins className="size-4" aria-hidden />
          <p className="text-sm">Preço médio do período</p>
        </div>
        <p className="mt-3 text-3xl font-extrabold text-ink">
          {formatCurrency(stats.average)}
        </p>
      </div>

      <div className="rounded-[24px] bg-canvas p-6">
        <div className="flex items-center gap-2 text-body">
          <TrendingUp className="size-4" aria-hidden />
          <p className="text-sm">Maior alta</p>
        </div>
        <p className="mt-3 text-3xl font-extrabold text-ink">
          {formatCurrency(stats.highest.precoMax)}
        </p>
        <p className="mt-1 text-sm text-mute">
          {stats.highest.categoria} · {formatDate(stats.highest.data)}
        </p>
      </div>

      <div className="rounded-[24px] bg-canvas p-6">
        <div className="flex items-center gap-2 text-body">
          <TrendingDown className="size-4" aria-hidden />
          <p className="text-sm">Menor preço</p>
        </div>
        <p className="mt-3 text-3xl font-extrabold text-ink">
          {formatCurrency(stats.lowest.precoMin)}
        </p>
        <p className="mt-1 text-sm text-mute">
          {stats.lowest.categoria} · {formatDate(stats.lowest.data)}
        </p>
      </div>

      <div className="rounded-[24px] bg-canvas-soft p-6">
        <div className="flex items-center gap-2 text-body">
          <CalendarDays className="size-4" aria-hidden />
          <p className="text-sm">Último lançamento</p>
        </div>
        <p className="mt-3 text-base font-semibold text-ink">
          {formatDate(stats.latest.data)}
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {stats.latest.entries.map((entry) => (
            <li
              key={entry.categoria}
              className="flex items-baseline justify-between gap-3 border-t border-canvas pt-2 first:border-t-0 first:pt-0"
            >
              <span className="text-sm text-body">{entry.categoria}</span>
              <span className="shrink-0 text-sm font-medium text-ink">
                {formatCurrency(entry.precoMin)} – {formatCurrency(entry.precoMax)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
