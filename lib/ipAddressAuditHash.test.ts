import { afterEach, describe, expect, it, vi } from "vitest";

import { getClientIpFromHeaders } from "./clientIpFromHeaders";
import { getIpAddressHashFromHeaders, hashIpAddressForAudit } from "./ipAddressAuditHash";

describe("hashIpAddressForAudit", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when no pepper or secret is configured", () => {
    vi.stubEnv("AUTH_IP_ADDRESS_PEPPER", "");
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("NEXTAUTH_SECRET", "");

    expect(hashIpAddressForAudit("203.0.113.1")).toBeNull();
  });

  it("returns a stable HMAC hex for a given IP and pepper", () => {
    vi.stubEnv("AUTH_IP_ADDRESS_PEPPER", "test-pepper");

    const first = hashIpAddressForAudit("203.0.113.1");
    const second = hashIpAddressForAudit("203.0.113.1");

    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).toBe(second);
  });

  it("uses AUTH_SECRET when AUTH_IP_ADDRESS_PEPPER is not set", () => {
    vi.stubEnv("AUTH_IP_ADDRESS_PEPPER", "");
    vi.stubEnv("NEXTAUTH_SECRET", "");
    vi.stubEnv("AUTH_SECRET", "fallback-secret");

    const hash = hashIpAddressForAudit("198.51.100.9");

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("getIpAddressHashFromHeaders", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("hashes the IP resolved from headers", () => {
    vi.stubEnv("AUTH_SECRET", "test-secret");

    const headers = new Headers({
      "x-forwarded-for": "203.0.113.55, 10.0.0.1",
    });

    const ip = getClientIpFromHeaders(headers);
    expect(ip).toBe("203.0.113.55");

    const fromHeaders = getIpAddressHashFromHeaders(headers);
    const direct = hashIpAddressForAudit("203.0.113.55");

    expect(fromHeaders).toBe(direct);
  });
});
