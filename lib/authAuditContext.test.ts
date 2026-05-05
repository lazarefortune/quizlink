import { afterEach, describe, expect, it, vi } from "vitest";

import { getAuthAuditFieldsFromHeaders, truncateUserAgent } from "./authAuditContext";

describe("truncateUserAgent", () => {
  it("returns null for empty or whitespace input", () => {
    expect(truncateUserAgent(null)).toBeNull();
    expect(truncateUserAgent("   ")).toBeNull();
  });

  it("truncates user agents longer than 500 characters", () => {
    const longUa = "a".repeat(520);

    expect(truncateUserAgent(longUa)?.length).toBe(500);
  });
});

describe("getAuthAuditFieldsFromHeaders", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("extracts user-agent and hashes IP when secret is set", () => {
    vi.stubEnv("AUTH_SECRET", "audit-test-secret");

    const headers = new Headers({
      "user-agent": "Vitest",
      "x-forwarded-for": "203.0.113.20",
    });

    const fields = getAuthAuditFieldsFromHeaders(headers);

    expect(fields.userAgent).toBe("Vitest");
    expect(fields.ipAddressHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
