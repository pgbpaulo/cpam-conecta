import { getRecentDays, getDayPrices, getDayHoliday } from "./data";
import { RecentDaysList } from "./recent-days-list";
import { StrawberryPriceForm } from "./strawberry-price-form";
import { UnsavedChangesProvider } from "./unsaved-changes-context";
import { toISODate, todayInSaoPaulo } from "@/lib/recent-days";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function LancarPrecoPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const params = await searchParams;
  const today = todayInSaoPaulo();
  const selectedDate =
    params.data && ISO_DATE_PATTERN.test(params.data) ? params.data : toISODate(today);

  const [days, initialValues, isHoliday] = await Promise.all([
    getRecentDays(today),
    getDayPrices(selectedDate),
    getDayHoliday(selectedDate),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-8 pb-16 lg:max-w-5xl lg:px-10 lg:py-10">
      <h1 className="text-[40px] leading-[34px] font-black text-ink lg:pb-2">
        Lançar preço
      </h1>

      {/* Below lg: list then form, stacked. At lg+: a two-column dashboard
          body — the recent-days list becomes a persistent side panel and the
          price form becomes the main working panel. Both panels are
          card-content (DESIGN.md): white, rounded-[24px], no border — the
          canvas/canvas-soft contrast against the page IS the elevation, at
          every breakpoint, not just desktop. */}
      <UnsavedChangesProvider>
        <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:items-start">
          <div className="rounded-[24px] bg-canvas py-2 lg:w-80 lg:shrink-0">
            <RecentDaysList days={days} selectedDate={selectedDate} />
          </div>
          <div className="rounded-[24px] bg-canvas p-6 lg:flex-1 lg:p-8">
            <StrawberryPriceForm
              key={selectedDate}
              date={selectedDate}
              initialValues={initialValues}
              isHoliday={isHoliday}
            />
          </div>
        </div>
      </UnsavedChangesProvider>
    </div>
  );
}
