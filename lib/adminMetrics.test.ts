import { describe, expect, it } from "vitest";

import { buildDailySignupSeries, normalizePage, normalizePageSize } from "./adminMetrics";

describe("adminMetrics", () => {
  it("normalizes page size to allowed values", () => {
    expect(normalizePageSize("50")).toBe(50);
    expect(normalizePageSize("12")).toBe(25);
    expect(normalizePageSize(undefined)).toBe(25);
  });

  it("normalizes page number to positive integer", () => {
    expect(normalizePage("3")).toBe(3);
    expect(normalizePage("0")).toBe(1);
    expect(normalizePage("-10")).toBe(1);
    expect(normalizePage(undefined)).toBe(1);
  });

  it("builds a daily series with zero-filled gaps in the requested timezone", () => {
    const emptyPoints = buildDailySignupSeries([], 3, "fr", "UTC");
    expect(emptyPoints).toHaveLength(3);
    expect(emptyPoints.every((point) => point.signups === 0)).toBe(true);

    const now = new Date("2026-08-31T12:00:00.000Z");
    const points = buildDailySignupSeries([now, now], 3, "fr", "UTC");
    expect(points.reduce((sum, point) => sum + point.signups, 0)).toBe(2);
  });
});
