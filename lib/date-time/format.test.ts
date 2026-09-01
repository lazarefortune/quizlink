import { describe, expect, it } from "vitest";

import { DEFAULT_TIME_ZONE } from "./constants";
import {
  clearDateTimeFormatterCacheForTests,
  formatCalendarDate,
  formatDate,
  formatDateOrDash,
  formatDateTime,
  formatDateTimeOrDash,
  formatTime,
  toIntlLocale,
} from "./format";
import { isValidTimeZone } from "./timezone";

/** 2026-08-31T17:25:00.000Z */
const FIXED_UTC = "2026-08-31T17:25:00.000Z";

describe("date-time format helpers", () => {
  it("maps app locales to BCP 47 tags", () => {
    expect(toIntlLocale("fr")).toBe("fr-FR");
    expect(toIntlLocale("en")).toBe("en-US");
  });

  it("formats the same instant in multiple timezones", () => {
    clearDateTimeFormatterCacheForTests();

    const parisHour = formatTime(FIXED_UTC, "fr", "Europe/Paris");
    const nyHour = formatTime(FIXED_UTC, "en", "America/New_York");
    const tokyoHour = formatTime(FIXED_UTC, "en", "Asia/Tokyo");
    const utcHour = formatTime(FIXED_UTC, "en", "UTC");

    expect(parisHour).toMatch(/19/);
    expect(nyHour).toMatch(/13/);
    expect(tokyoHour).toMatch(/02|2/);
    expect(utcHour).toMatch(/17/);
  });

  it("formats datetime in Europe/Paris regardless of process TZ", () => {
    const formatted = formatDateTime(FIXED_UTC, "fr", "Europe/Paris");
    expect(formatted).toContain("2026");
    expect(formatted).toMatch(/31/);
    expect(formatted).toMatch(/19/);
    expect(formatted).toMatch(/25/);
  });

  it("formats date-only without clock time", () => {
    const formatted = formatDate(FIXED_UTC, "fr", "Europe/Paris");
    expect(formatted).toMatch(/31/);
    expect(formatted).toMatch(/2026/);
    expect(formatted).not.toMatch(/\d{1,2}:\d{2}/);
  });

  it("returns dash placeholders for nullish values", () => {
    expect(formatDateTimeOrDash(null, "fr", "Europe/Paris")).toBe("-");
    expect(formatDateOrDash(undefined, "en", "UTC", "n/a")).toBe("n/a");
  });

  it("formats civil calendar dates without shifting the day", () => {
    expect(formatCalendarDate("1999-03-14", "fr")).toMatch(/14/);
    expect(formatCalendarDate("1999-03-14", "fr")).toMatch(/mars|March/i);
  });

  it("uses DEFAULT_TIME_ZONE as product fallback constant", () => {
    expect(DEFAULT_TIME_ZONE).toBe("Europe/Paris");
    expect(isValidTimeZone(DEFAULT_TIME_ZONE)).toBe(true);
  });
});
