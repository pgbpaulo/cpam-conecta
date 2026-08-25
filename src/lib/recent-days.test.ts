import { describe, expect, it } from "vitest";
import { computeRecentDays, toISODate } from "./recent-days";

describe("toISODate", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(toISODate(new Date("2026-08-21T12:00:00"))).toBe("2026-08-21");
  });
});

describe("computeRecentDays", () => {
  const today = new Date("2026-08-21T12:00:00"); // Friday

  it("excludes Sundays from the window", () => {
    const days = computeRecentDays(today, new Set(), new Set(), 7);
    const dates = days.map((d) => d.date);

    expect(dates).toEqual([
      "2026-08-21",
      "2026-08-20",
      "2026-08-19",
      "2026-08-18",
      "2026-08-17",
      "2026-08-15",
    ]);
  });

  it("marks dates present in launchedDates as lancado, others as sem-lancamento", () => {
    const days = computeRecentDays(today, new Set(["2026-08-20"]), new Set(), 7);

    expect(days.find((d) => d.date === "2026-08-20")?.status).toBe("lancado");
    expect(days.find((d) => d.date === "2026-08-19")?.status).toBe("sem-lancamento");
  });

  it("marks dates present in holidayDates as feriado", () => {
    const days = computeRecentDays(today, new Set(), new Set(["2026-08-19"]), 7);

    expect(days.find((d) => d.date === "2026-08-19")?.status).toBe("feriado");
  });

  it("treats a date as feriado even if it also appears in launchedDates", () => {
    const days = computeRecentDays(
      today,
      new Set(["2026-08-19"]),
      new Set(["2026-08-19"]),
      7
    );

    expect(days.find((d) => d.date === "2026-08-19")?.status).toBe("feriado");
  });

  it("returns 13 days for the default 15-day window (2 Sundays excluded)", () => {
    const days = computeRecentDays(today, new Set(), new Set());

    expect(days).toHaveLength(13);
  });
});
