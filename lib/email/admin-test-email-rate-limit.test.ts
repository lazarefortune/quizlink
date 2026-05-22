import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

import {
  checkAdminTestEmailRateLimit,
  recordAdminTestEmailSend,
  resetAdminTestEmailRateLimitForTests,
} from "./admin-test-email-rate-limit";

describe("admin-test-email-rate-limit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetAdminTestEmailRateLimitForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first send for an admin", () => {
    expect(checkAdminTestEmailRateLimit("admin-1")).toEqual({ allowed: true });
  });

  it("blocks sends within 30 seconds", () => {
    recordAdminTestEmailSend("admin-1");

    vi.advanceTimersByTime(10_000);

    expect(checkAdminTestEmailRateLimit("admin-1")).toEqual({
      allowed: false,
      reason: "too_soon",
    });
  });

  it("allows send after 30 seconds", () => {
    recordAdminTestEmailSend("admin-1");

    vi.advanceTimersByTime(30_000);

    expect(checkAdminTestEmailRateLimit("admin-1")).toEqual({ allowed: true });
  });

  it("blocks after 10 sends in one hour", () => {
    for (let i = 0; i < 10; i += 1) {
      recordAdminTestEmailSend("admin-1");
      vi.advanceTimersByTime(30_000);
    }

    expect(checkAdminTestEmailRateLimit("admin-1")).toEqual({
      allowed: false,
      reason: "hourly_limit",
    });
  });
});
