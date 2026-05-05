import { describe, expect, it } from "vitest";

import { getClientIpFromHeaders } from "./clientIpFromHeaders";

describe("getClientIpFromHeaders", () => {
  it("returns the first hop from x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    });

    expect(getClientIpFromHeaders(headers)).toBe("203.0.113.10");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const headers = new Headers({
      "x-real-ip": "198.51.100.2",
    });

    expect(getClientIpFromHeaders(headers)).toBe("198.51.100.2");
  });

  it("returns null when no trusted headers are present", () => {
    const headers = new Headers();

    expect(getClientIpFromHeaders(headers)).toBeNull();
  });
});
