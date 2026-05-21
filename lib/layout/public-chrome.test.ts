import { describe, expect, it } from "vitest";

import { shouldHidePublicHeader } from "./public-chrome";

describe("shouldHidePublicHeader", () => {
  it("shows header on marketing routes", () => {
    expect(shouldHidePublicHeader("/")).toBe(false);
    expect(shouldHidePublicHeader("/quizzes")).toBe(false);
  });

  it("hides header on auth routes", () => {
    expect(shouldHidePublicHeader("/auth/signin")).toBe(true);
    expect(shouldHidePublicHeader("/auth/signup")).toBe(true);
  });

  it("hides header on app shell routes", () => {
    expect(shouldHidePublicHeader("/dashboard")).toBe(true);
    expect(shouldHidePublicHeader("/builder/edit")).toBe(true);
    expect(shouldHidePublicHeader("/quiz/abc")).toBe(true);
  });
});
