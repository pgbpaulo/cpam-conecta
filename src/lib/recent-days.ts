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

// Pins "today" to America/Sao_Paulo instead of the server's local timezone,
// so the app keeps computing the correct calendar day once it runs somewhere
// other than the dev machine (e.g. a UTC cloud host). Returns a Date whose
// local calendar fields already carry the Sao Paulo date, so it can be
// passed straight into toISODate/computeRecentDays without further
// conversion.
export function todayInSaoPaulo(): Date {
  const isoDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
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
