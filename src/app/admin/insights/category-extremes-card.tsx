import { ArrowUpDown } from "lucide-react";

import { type StrawberryCategory } from "@/lib/validation/strawberry-price";
import type { CategoryExtreme } from "./category-extremes";

// Same category→color mapping as annual-averages-chart.tsx and
// price-trend-chart.tsx, reused verbatim so the swatch here reads as the
// same category identity as the charts above it on the page.
const CATEGORY_COLOR: Record<StrawberryCategory, string> = {
  Velho: "#2a78d6",
  Bom: "#eb6834",
  "Safra Nova Top": "#1baf7a",
  "Safra Nova Diferenciado": "#eda100",
};

const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrency(value: number): string {
  return CURRENCY_FORMATTER.format(value);
}

function CategorySwatch({ category }: { category: StrawberryCategory }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className="shrink-0">
      <rect width="10" height="10" rx="3" fill={CATEGORY_COLOR[category]} />
    </svg>
  );
}

export function CategoryExtremesCard({ extremes }: { extremes: CategoryExtreme[] }) {
  return (
    <section
      aria-label="Faixa de preço por categoria no período"
      className="rounded-[24px] bg-canvas p-6"
    >
      <div className="flex items-center gap-2 text-body">
        <ArrowUpDown className="size-4" aria-hidden />
        <p className="text-sm">Faixa de preço por categoria no período</p>
      </div>
      <ul className="mt-3 flex flex-col gap-3">
        {extremes.map((entry) => (
          <li
            key={entry.categoria}
            className="flex items-center justify-between gap-3 border-t border-canvas-soft pt-3 first:border-t-0 first:pt-0"
          >
            <span className="flex items-center gap-2 text-sm text-body">
              <CategorySwatch category={entry.categoria} />
              {entry.categoria}
            </span>
            {entry.min === null || entry.max === null ? (
              <span className="shrink-0 text-sm text-mute">Sem dados</span>
            ) : (
              <span className="shrink-0 text-sm font-medium text-ink">
                {formatCurrency(entry.min)} – {formatCurrency(entry.max)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
