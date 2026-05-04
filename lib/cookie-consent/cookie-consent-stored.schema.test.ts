import { describe, expect, it } from "vitest";
import { cookieConsentStoredSchema } from "./cookie-consent-stored.schema";

describe("cookieConsentStoredSchema", () => {
  it("accepts valid payload", () => {
    const result = cookieConsentStoredSchema.safeParse({
      version: 1,
      analytics: true,
      sessionReplay: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects wrong version", () => {
    const result = cookieConsentStoredSchema.safeParse({
      version: 2,
      analytics: true,
      sessionReplay: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(
      cookieConsentStoredSchema.safeParse({ version: 1 }).success,
    ).toBe(false);
  });
});
