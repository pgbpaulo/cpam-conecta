import { getRecentDays, getDayPrices } from "./data";
import { RecentDaysList } from "./recent-days-list";
import { StrawberryPriceForm } from "./strawberry-price-form";
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

  const [days, initialValues] = await Promise.all([
    getRecentDays(today),
    getDayPrices(selectedDate),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-10 pb-16">
      <h1 className="px-5 pt-8 text-xl font-bold text-chalk-white">Lançar preço</h1>
      <RecentDaysList days={days} selectedDate={selectedDate} />
      <StrawberryPriceForm key={selectedDate} date={selectedDate} initialValues={initialValues} />
    </div>
  );
}
