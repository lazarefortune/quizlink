import { describe, expect, it } from "vitest";
import {
  getClientConsentAllowsAnalytics,
  setClientAnalyticsConsent,
} from "./consent-gate";

describe("consent-gate", () => {
  it("defaults to no analytics", () => {
    setClientAnalyticsConsent(false);
    expect(getClientConsentAllowsAnalytics()).toBe(false);
  });

  it("reflects opt-in", () => {
    setClientAnalyticsConsent(true);
    expect(getClientConsentAllowsAnalytics()).toBe(true);
    setClientAnalyticsConsent(false);
  });
});
