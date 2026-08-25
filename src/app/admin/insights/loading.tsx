import { cn } from "@/lib/utils";

// Route-level Suspense fallback (Next.js loading.js) shown instantly while
// navigating into /admin/insights — page.tsx does two real Supabase fetches
// (price history + annual averages) before rendering, so switching here from
// another module (e.g. lançar preço) would otherwise block with no feedback.
// Mirrors page.tsx's section-by-section shape (period filter, summary strip,
// category extremes, two charts) so the swap to real content doesn't shift
// layout. The h1 renders its real text immediately — it's static across
// navigations, so there's nothing to skeleton there.

function Bar({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <div aria-hidden style={style} className={cn("animate-pulse rounded-full bg-canvas-soft", className)} />;
}

const SKELETON_RANGE_WIDTHS = [64, 64, 80, 56];
const SKELETON_STATS = 4;
const SKELETON_EXTREMES = 4;
const SKELETON_LEGEND_ITEMS = 4;

function ChartCardSkeleton({ label }: { label: string }) {
  return (
    <section aria-label={label} className="rounded-[24px] bg-canvas p-6">
      <Bar className="h-[360px] w-full rounded-[16px]" />
      <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
        {Array.from({ length: SKELETON_LEGEND_ITEMS }).map((_, index) => (
          <Bar key={index} className="h-4 w-20" />
        ))}
      </div>
    </section>
  );
}

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Carregando insights"
      className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-8 pb-16 lg:max-w-5xl lg:px-10 lg:py-10"
    >
      <h1 className="text-[40px] leading-[34px] font-black text-ink lg:pb-2">Insights</h1>

      <div className="inline-flex w-full gap-1 rounded-full bg-canvas p-1 sm:w-auto">
        {SKELETON_RANGE_WIDTHS.map((width, index) => (
          <Bar key={index} className="h-9 flex-1 sm:flex-none" style={{ width }} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: SKELETON_STATS }).map((_, index) => (
          <div key={index} className="rounded-[24px] bg-canvas p-6">
            <div className="flex items-center gap-2">
              <Bar className="size-4 shrink-0" />
              <Bar className="h-3.5 w-24" />
            </div>
            <Bar className="mt-3 h-7 w-28" />
          </div>
        ))}
      </div>

      <section aria-label="Faixa de preço por categoria no período" className="rounded-[24px] bg-canvas p-6">
        <div className="flex items-center gap-2">
          <Bar className="size-4 shrink-0" />
          <Bar className="h-3.5 w-56" />
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {Array.from({ length: SKELETON_EXTREMES }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 border-t border-canvas-soft pt-3 first:border-t-0 first:pt-0"
            >
              <div className="flex items-center gap-2">
                <Bar className="size-2.5 shrink-0" />
                <Bar className="h-4 w-32" />
              </div>
              <Bar className="h-4 w-20" />
            </div>
          ))}
        </div>
      </section>

      <ChartCardSkeleton label="Evolução do preço do morango" />
      <ChartCardSkeleton label="Média anual do preço do morango" />
    </div>
  );
}
