export type DayStatus = "lancado" | "sem-lancamento";

export type RecentDay = {
  date: string;
  status: DayStatus;
};

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const SUNDAY = 0;

export function computeRecentDays(
  today: Date,
  launchedDates: ReadonlySet<string>,
  windowDays = 15
): RecentDay[] {
  const days: RecentDay[] = [];

  for (let offset = 0; offset < windowDays; offset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);

    if (date.getDay() === SUNDAY) {
      continue;
    }

    const isoDate = toISODate(date);
    days.push({
      date: isoDate,
      status: launchedDates.has(isoDate) ? "lancado" : "sem-lancamento",
    });
  }

  return days;
}
