import { describe, it, expect } from "vitest";

import { shouldInterceptNavigation } from "./should-intercept-builder-navigation";

describe("shouldInterceptNavigation", () => {
  it("returns false when not dirty", () => {
    expect(
      shouldInterceptNavigation("/builder", "/dashboard", false),
    ).toBe(false);
  });

  it("returns false when pathname is not under /builder", () => {
    expect(
      shouldInterceptNavigation("/dashboard", "/account", true),
    ).toBe(false);
  });

  it("returns false when target stays under /builder", () => {
    expect(
      shouldInterceptNavigation("/builder/clxyz", "/builder/clxyz", true),
    ).toBe(false);
    expect(
      shouldInterceptNavigation("/builder", "/builder/preview", true),
    ).toBe(false);
  });

  it("returns true when leaving /builder to dashboard with dirty state", () => {
    expect(
      shouldInterceptNavigation("/builder", "/dashboard", true),
    ).toBe(true);
    expect(
      shouldInterceptNavigation("/builder/clabc", "/dashboard/quizzes", true),
    ).toBe(true);
  });

  it("returns true when leaving /builder to account or create", () => {
    expect(
      shouldInterceptNavigation("/builder/clabc", "/account", true),
    ).toBe(true);
    expect(
      shouldInterceptNavigation("/builder/clabc", "/dashboard/create", true),
    ).toBe(true);
  });

  it("returns false for hash-only href", () => {
    expect(shouldInterceptNavigation("/builder", "#section", true)).toBe(
      false,
    );
  });
});
