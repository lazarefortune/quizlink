import { describe, expect, it } from "vitest";

import {
  buildSignInHref,
  buildSignUpHref,
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
  it("includes verified flag, email, and safe callbackUrl", () => {
    expect(
      buildSignInHref("/dashboard", { verified: true, email: "user@example.com" }),
    ).toBe("/auth/signin?verified=true&email=user%40example.com&callbackUrl=%2Fdashboard");
  });
});

describe("buildSignUpHref", () => {
  it("includes safe callbackUrl", () => {
    expect(buildSignUpHref("/builder/preview")).toBe(
      "/auth/signup?callbackUrl=%2Fbuilder%2Fpreview",
    );
  });

  it("rejects unsafe callbackUrl", () => {
    expect(buildSignUpHref("https://evil.example")).toBe("/auth/signup");
  });
});
