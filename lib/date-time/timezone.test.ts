import { describe, expect, it } from "vitest";

import { DEFAULT_TIME_ZONE } from "./constants";
import {
  detectBrowserTimeZone,
  getHourInTimeZone,
  isValidTimeZone,
  resolveEffectiveTimeZone,
  toDateKeyInTimeZone,
} from "./timezone";

describe("timezone helpers", () => {
  it("validates IANA timezones", () => {
    expect(isValidTimeZone("Europe/Paris")).toBe(true);
    expect(isValidTimeZone("America/New_York")).toBe(true);
    expect(isValidTimeZone("UTC+1")).toBe(false);
    expect(isValidTimeZone("Not/AZone")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });

  it("resolves manual preference over cookie", () => {
    expect(
      resolveEffectiveTimeZone({
        userTimeZone: "America/Toronto",
        cookieTimeZone: "Europe/Paris",
      }),
    ).toBe("America/Toronto");
  });

  it("treats null user preference as automatic", () => {
    expect(
      resolveEffectiveTimeZone({
        userTimeZone: null,
        cookieTimeZone: "Asia/Tokyo",
      }),
    ).toBe("Asia/Tokyo");
  });

  it("falls back to DEFAULT_TIME_ZONE when nothing valid is available", () => {
    expect(
      resolveEffectiveTimeZone({
        userTimeZone: "invalid",
        cookieTimeZone: "also-invalid",
      }),
    ).toBe(DEFAULT_TIME_ZONE);
  });

  it("computes hour and date key in a timezone", () => {
    const instant = new Date("2026-08-31T17:25:00.000Z");
    expect(getHourInTimeZone(instant, "Europe/Paris")).toBe(19);
    expect(toDateKeyInTimeZone(instant, "Europe/Paris")).toBe("2026-08-31");
    expect(toDateKeyInTimeZone(instant, "America/Los_Angeles")).toBe("2026-08-31");
  });

  it("detectBrowserTimeZone returns a valid IANA zone when Intl is available", () => {
    expect(isValidTimeZone(detectBrowserTimeZone())).toBe(true);
  });
});
