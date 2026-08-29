import { describe, expect, it, afterEach, vi } from "vitest";
import {
  ANALYTICS_CONSENT_COOKIE,
  isAnalyticsConsentCookieAllowed,
  buildAnalyticsConsentCookieAttributes,
} from "./analytics-consent-cookie";

describe("analytics-consent-cookie", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("treats only value 1 as allowed", () => {
    expect(isAnalyticsConsentCookieAllowed("1")).toBe(true);
    expect(isAnalyticsConsentCookieAllowed("0")).toBe(false);
    expect(isAnalyticsConsentCookieAllowed(undefined)).toBe(false);
  });

  it("builds a Lax cookie with the consent name", () => {
    const attrs = buildAnalyticsConsentCookieAttributes(true);
    expect(attrs).toContain(`${ANALYTICS_CONSENT_COOKIE}=1`);
    expect(attrs).toContain("SameSite=Lax");
    expect(attrs).toContain("Path=/");
  });
});
