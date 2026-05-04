import { describe, expect, it } from "vitest";
import {
  parseStoredConsentJson,
  storedToConsent,
} from "./consent-storage";

describe("parseStoredConsentJson", () => {
  it("parses valid JSON", () => {
    expect(
      parseStoredConsentJson(
        JSON.stringify({ version: 1, analytics: true, sessionReplay: true }),
      ),
    ).toEqual({ version: 1, analytics: true, sessionReplay: true });
  });

  it("returns null on invalid JSON", () => {
    expect(parseStoredConsentJson("{")).toBe(null);
  });

  it("returns null on invalid shape", () => {
    expect(parseStoredConsentJson(JSON.stringify({ foo: 1 }))).toBe(null);
  });
});

describe("storedToConsent", () => {
  it("clears session replay when analytics is false", () => {
    expect(
      storedToConsent({
        version: 1,
        analytics: false,
        sessionReplay: true,
      }),
    ).toEqual({
      hasRecordedChoice: true,
      analytics: false,
      sessionReplay: false,
    });
  });
});
