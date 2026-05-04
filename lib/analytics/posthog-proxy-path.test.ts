import { describe, expect, it, vi, afterEach } from "vitest";
import { getPosthogProxyBasePath, POSTHOG_PROXY_DEFAULT } from "./posthog-proxy-path";

describe("getPosthogProxyBasePath", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns default when env unset", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROXY_PATH", "");
    expect(getPosthogProxyBasePath()).toBe(POSTHOG_PROXY_DEFAULT);
  });

  it("returns custom path when valid", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROXY_PATH", "/my-events");
    expect(getPosthogProxyBasePath()).toBe("/my-events");
  });

  it("strips trailing slashes", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROXY_PATH", "/my-events/");
    expect(getPosthogProxyBasePath()).toBe("/my-events");
  });

  it("rejects path traversal", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROXY_PATH", "/foo/../bar");
    expect(getPosthogProxyBasePath()).toBe(POSTHOG_PROXY_DEFAULT);
  });
});
