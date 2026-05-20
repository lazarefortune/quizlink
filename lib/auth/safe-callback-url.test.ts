import { describe, expect, it } from "vitest";

import {
  buildSignInHref,
  buildVerifyEmailHref,
  resolveSafeCallbackUrl,
} from "./safe-callback-url";

describe("resolveSafeCallbackUrl", () => {
  it("returns dashboard when callback is missing", () => {
    expect(resolveSafeCallbackUrl(null)).toBe("/dashboard");
    expect(resolveSafeCallbackUrl(undefined)).toBe("/dashboard");
  });

  it("returns safe relative callback paths", () => {
    expect(resolveSafeCallbackUrl("/builder/preview")).toBe("/builder/preview");
  });

  it("rejects open redirects", () => {
    expect(resolveSafeCallbackUrl("//evil.example")).toBe("/dashboard");
    expect(resolveSafeCallbackUrl("https://evil.example")).toBe("/dashboard");
  });
});

describe("buildVerifyEmailHref", () => {
  it("includes email and safe callbackUrl", () => {
    expect(buildVerifyEmailHref("user@example.com", "/builder/preview", { created: true })).toBe(
      "/auth/verify-email?email=user%40example.com&callbackUrl=%2Fbuilder%2Fpreview&created=true",
    );
  });

  it("omits unsafe callbackUrl", () => {
    expect(buildVerifyEmailHref("user@example.com", "//evil.example", { created: true })).toBe(
      "/auth/verify-email?email=user%40example.com&created=true",
    );
  });
});

describe("buildSignInHref", () => {
  it("includes verified flag and safe callbackUrl", () => {
    expect(buildSignInHref("/dashboard", true)).toBe(
      "/auth/signin?verified=true&callbackUrl=%2Fdashboard",
    );
  });
});
