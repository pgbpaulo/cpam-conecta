import { cn } from "@/lib/utils";

// Route-level Suspense fallback (Next.js loading.js) shown instantly while
// navigating into /admin/lancar-preco — page.tsx does a real Supabase fetch
// before rendering, so switching here from another module (e.g. insights)
// would otherwise block with no feedback. Mirrors page.tsx's two-panel shape
// (recent-days list + price form) at every breakpoint so the swap to real
// content doesn't shift layout. The h1 renders its real text immediately —
// it's static across navigations, so there's nothing to skeleton there.

function Bar({ className }: { className: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-full bg-canvas-soft", className)} />;
}

const SKELETON_DAYS = Array.from({ length: 6 });
const SKELETON_CATEGORIES = Array.from({ length: 4 });

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Carregando lançamento de preço"
      className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-8 pb-16 lg:max-w-5xl lg:px-10 lg:py-10"
    >
      <h1 className="text-[40px] leading-[34px] font-black text-ink lg:pb-2">Lançar preço</h1>

      <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:items-start">
        <div className="rounded-[24px] bg-canvas py-2 lg:w-80 lg:shrink-0">
          {SKELETON_DAYS.map((_, index) => (
            <div
              key={index}
              className="flex min-h-12 items-center justify-between gap-4 border-b border-canvas-soft px-3.5 py-3 last:border-b-0"
            >
              <div className="flex items-baseline gap-3">
                <Bar className="h-3.5 w-8" />
                <Bar className="h-4 w-12" />
              </div>
              <Bar className="h-5 w-20" />
            </div>
          ))}
        </div>

        <div className="rounded-[24px] bg-canvas p-6 lg:flex-1 lg:p-8">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-1.5">
              <Bar className="h-3.5 w-10" />
              <div className="flex items-center gap-3">
                <Bar className="h-12 flex-1 rounded-[12px]" />
                <Bar className="h-12 w-20 rounded-[12px]" />
              </div>
            </div>

            <div className="flex flex-col">
              {SKELETON_CATEGORIES.map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-4 border-b border-canvas-soft py-5 first:pt-0 last:border-b-0"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Bar className="size-2.5 shrink-0" />
                      <Bar className="h-4 w-32" />
                    </div>
                    <Bar className="h-4 w-20" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Bar className="h-12 rounded-[12px]" />
                    <Bar className="h-12 rounded-[12px]" />
                  </div>
                </div>
              ))}
            </div>

            <Bar className="h-12 w-full rounded-[24px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
