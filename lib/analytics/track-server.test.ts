import { describe, expect, it, vi, beforeEach } from "vitest";

const mockCapture = vi.fn();
const mockFlush = vi.fn(async () => undefined);
const mockAllows = vi.fn(async () => false);

vi.mock("@/lib/observability/posthog-server", () => ({
  getPostHogServer: () => ({
    capture: (...args: unknown[]) => mockCapture(...args),
    flush: () => mockFlush(),
  }),
  getPostHogServerReleaseProperties: () => ({ service_version: "test" }),
}));

vi.mock("@/lib/cookie-consent/analytics-consent-server", () => ({
  getServerAllowsProductAnalytics: () => mockAllows(),
}));

import { trackServer } from "./track-server";

describe("trackServer consent gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not capture when analytics consent is refused", async () => {
    mockAllows.mockResolvedValue(false);
    await trackServer("user-1", "signup_completed", { method: "email" });
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("captures when analytics consent is allowed", async () => {
    mockAllows.mockResolvedValue(true);
    await trackServer("user-1", "signup_completed", { method: "email" });
    expect(mockCapture).toHaveBeenCalledTimes(1);
    expect(mockFlush).toHaveBeenCalled();
  });
});
