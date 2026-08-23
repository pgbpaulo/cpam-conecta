import { describe, expect, it } from "vitest";
import { rangeToDateInterval } from "./date-range";

describe("rangeToDateInterval", () => {
  const today = new Date("2026-08-23T12:00:00");

  it("returns a 30-day window ending today", () => {
    expect(rangeToDateInterval("30d", today)).toEqual({
      from: "2026-07-25",
      to: "2026-08-23",
    });
  });

  it("returns a 90-day window ending today", () => {
    expect(rangeToDateInterval("90d", today)).toEqual({
      from: "2026-05-26",
      to: "2026-08-23",
    });
  });

  it("returns the current calendar year for 'ano'", () => {
    expect(rangeToDateInterval("ano", today)).toEqual({
      from: "2026-01-01",
      to: "2026-08-23",
    });
  });

  it("returns a sentinel start date for 'tudo'", () => {
    expect(rangeToDateInterval("tudo", today)).toEqual({
      from: "1900-01-01",
      to: "2026-08-23",
    });
  });
});
