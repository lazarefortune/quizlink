import { describe, expect, it } from "vitest";

import {
  APP_TIMEZONE,
  formatDate,
  formatDateOrDash,
  formatDateTime,
  formatDateTimeOrDash,
  toIntlLocale,
} from "./formatDateTime";

/** 2026-08-31T17:25:00.000Z → 19:25 in Europe/Paris (CEST). */
const FIXED_UTC = "2026-08-31T17:25:00.000Z";

describe("formatDateTime", () => {
  it("exposes Europe/Paris as the app timezone", () => {
    expect(APP_TIMEZONE).toBe("Europe/Paris");
  });

  it("maps app locales to BCP 47 tags", () => {
    expect(toIntlLocale("fr")).toBe("fr-FR");
    expect(toIntlLocale("en")).toBe("en-US");
  });

  it("formats datetime in Europe/Paris regardless of process TZ", () => {
    const parts = new Intl.DateTimeFormat("fr-FR", {
      timeZone: APP_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date(FIXED_UTC));
    const hour = parts.find((p) => p.type === "hour")?.value;
    const minute = parts.find((p) => p.type === "minute")?.value;
    expect(hour).toBe("19");
    expect(minute).toBe("25");

    const formatted = formatDateTime(FIXED_UTC, "fr");
    expect(formatted).toContain("2026");
    expect(formatted).toMatch(/31/);
    expect(formatted).toMatch(/19/);
    expect(formatted).toMatch(/25/);
  });

  it("formats date-only without a clock time mismatch risk", () => {
    const formatted = formatDate(FIXED_UTC, "fr");
    expect(formatted).toMatch(/31/);
    expect(formatted).toMatch(/2026/);
    expect(formatted).not.toMatch(/\d{1,2}:\d{2}/);
  });

  it("returns dash placeholders for nullish values", () => {
    expect(formatDateTimeOrDash(null, "fr")).toBe("-");
    expect(formatDateOrDash(undefined, "en", "n/a")).toBe("n/a");
  });
});
