import { getPriceHistory, getAnnualAverages } from "./data";
import { buildTrendSeries } from "./trend-series";
import { buildAnnualSeries } from "./annual-series";
import { computeSummaryStats } from "./summary";
import { INSIGHTS_RANGES, type InsightsRange } from "./date-range";
import { PeriodFilter } from "./period-filter";
import { SummaryStats } from "./summary-stats";
import { PriceTrendChart } from "./price-trend-chart";
import { AnnualAveragesChart } from "./annual-averages-chart";
import { todayInSaoPaulo } from "@/lib/recent-days";

const DEFAULT_RANGE: InsightsRange = "90d";

function parseRange(value: string | undefined): InsightsRange {
  return (INSIGHTS_RANGES as readonly string[]).includes(value ?? "")
    ? (value as InsightsRange)
    : DEFAULT_RANGE;
}

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = parseRange(params.range);
  const today = todayInSaoPaulo();

  const [historyRows, annualAverages] = await Promise.all([
    getPriceHistory(range, today),
    getAnnualAverages(),
  ]);

  const trendPoints = buildTrendSeries(historyRows);
  const annualPoints = buildAnnualSeries(annualAverages);
  const stats = computeSummaryStats(historyRows);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-8 pb-16 lg:max-w-5xl lg:px-10 lg:py-10">
      <h1 className="text-[40px] leading-[34px] font-black text-ink lg:pb-2">Insights</h1>

      <PeriodFilter current={range} />

      <SummaryStats stats={stats} />

      <PriceTrendChart points={trendPoints} />

      <AnnualAveragesChart points={annualPoints} />
    </div>
  );
}
