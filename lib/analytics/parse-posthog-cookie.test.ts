import { describe, expect, it } from "vitest";
import { parsePostHogDistinctIdFromCookieHeader } from "./parse-posthog-cookie";

describe("parsePostHogDistinctIdFromCookieHeader", () => {
  it("returns undefined when cookie missing", () => {
    expect(parsePostHogDistinctIdFromCookieHeader(undefined)).toBeUndefined();
  });

  it("extracts distinct_id from PostHog cookie", () => {
    const payload = encodeURIComponent(JSON.stringify({ distinct_id: "abc-123" }));
    const header = `other=1; ph_phc_testtoken_posthog=${payload}; session=x`;
    expect(parsePostHogDistinctIdFromCookieHeader(header)).toBe("abc-123");
  });
});
