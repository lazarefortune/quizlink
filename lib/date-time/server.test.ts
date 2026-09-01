import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => cookiesMock(),
}));

import { getRequestTimeZone } from "./server";
import { TIME_ZONE_COOKIE } from "./constants";

describe("getRequestTimeZone", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
  });

  it("reads a valid timezone from the cookie", async () => {
    cookiesMock.mockResolvedValue({
      get: (name: string) =>
        name === TIME_ZONE_COOKIE
          ? { value: "America/Toronto" }
          : undefined,
    });

    await expect(getRequestTimeZone()).resolves.toBe("America/Toronto");
  });

  it("prefers manual user timezone over cookie", async () => {
    cookiesMock.mockResolvedValue({
      get: () => ({ value: "Europe/Paris" }),
    });

    await expect(
      getRequestTimeZone({ userTimeZone: "Asia/Tokyo" }),
    ).resolves.toBe("Asia/Tokyo");
  });

  it("falls back when cookie is invalid", async () => {
    cookiesMock.mockResolvedValue({
      get: () => ({ value: "UTC+2" }),
    });

    await expect(getRequestTimeZone()).resolves.toBe("Europe/Paris");
  });
});
