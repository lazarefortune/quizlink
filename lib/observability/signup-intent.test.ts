import { describe, expect, it } from "vitest";
import {
  isSignupIntentCookieValue,
  SIGNUP_INTENT_COOKIE,
} from "./signup-intent";
import { mapSignupDomainErrorToAnalyticsCode } from "@/lib/analytics/signup-analytics";

describe("signup-intent", () => {
  it("recognizes the cookie marker value", () => {
    expect(SIGNUP_INTENT_COOKIE).toBe("ql_signup_intent");
    expect(isSignupIntentCookieValue("1")).toBe(true);
    expect(isSignupIntentCookieValue("0")).toBe(false);
    expect(isSignupIntentCookieValue(undefined)).toBe(false);
  });
});

describe("mapSignupDomainErrorToAnalyticsCode", () => {
  it("maps email already in use", () => {
    expect(mapSignupDomainErrorToAnalyticsCode("EMAIL_ALREADY_IN_USE")).toBe(
      "email_already_exists",
    );
  });

  it("falls back to unknown", () => {
    expect(mapSignupDomainErrorToAnalyticsCode("OTHER")).toBe("unknown");
  });
});
