import { getRecentDays, getDayPrices } from "./data";
import { RecentDaysList } from "./recent-days-list";
import { StrawberryPriceForm } from "./strawberry-price-form";
import { toISODate } from "@/lib/recent-days";

export default async function LancarPrecoPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const params = await searchParams;
  const today = new Date();
  const selectedDate = params.data ?? toISODate(today);

  const [days, initialValues] = await Promise.all([
    getRecentDays(today),
    getDayPrices(selectedDate),
  ]);

  return (
    <div>
      <RecentDaysList days={days} selectedDate={selectedDate} />
      <StrawberryPriceForm date={selectedDate} initialValues={initialValues} />
    </div>
  );
}
