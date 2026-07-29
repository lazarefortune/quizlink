import { describe, expect, it } from "vitest";

import {
  isLegacyUntitledQuizName,
  isUntitledQuizName,
  isValidQuizName,
  normalizeQuizName,
  resolveBuilderQuizNameForEditing,
  resolveQuizDisplayName,
} from "./quizNameValidation";

describe("normalizeQuizName", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeQuizName("  My quiz  ")).toBe("My quiz");
  });
});

describe("isUntitledQuizName", () => {
  it("treats empty and whitespace-only names as untitled", () => {
    expect(isUntitledQuizName("")).toBe(true);
    expect(isUntitledQuizName("   ")).toBe(true);
  });

  it("treats legacy sentinel names as untitled", () => {
    expect(isUntitledQuizName("Quiz sans titre")).toBe(true);
    expect(isUntitledQuizName("Untitled quiz")).toBe(true);
    expect(isUntitledQuizName("  Quiz sans titre  ")).toBe(true);
  });

  it("does not treat real titles as untitled", () => {
    expect(isUntitledQuizName("Weekend trivia")).toBe(false);
  });
});

describe("isValidQuizName", () => {
  it("rejects empty, whitespace, and legacy sentinel names", () => {
    expect(isValidQuizName("")).toBe(false);
    expect(isValidQuizName("   ")).toBe(false);
    expect(isValidQuizName("Quiz sans titre")).toBe(false);
    expect(isValidQuizName("Untitled quiz")).toBe(false);
  });

  it("accepts a real title", () => {
    expect(isValidQuizName("Blind test du week-end")).toBe(true);
  });
});

describe("isLegacyUntitledQuizName", () => {
  it("detects only known legacy sentinels", () => {
    expect(isLegacyUntitledQuizName("Quiz sans titre")).toBe(true);
    expect(isLegacyUntitledQuizName("Untitled quiz")).toBe(true);
    expect(isLegacyUntitledQuizName("")).toBe(false);
    expect(isLegacyUntitledQuizName("Mon quiz")).toBe(false);
  });
});

describe("resolveBuilderQuizNameForEditing", () => {
  it("shows legacy sentinels as empty in the builder field", () => {
    expect(resolveBuilderQuizNameForEditing("Quiz sans titre")).toBe("");
    expect(resolveBuilderQuizNameForEditing("Untitled quiz")).toBe("");
  });

  it("keeps real titles unchanged", () => {
    expect(resolveBuilderQuizNameForEditing("Mon quiz")).toBe("Mon quiz");
  });
});

describe("resolveQuizDisplayName", () => {
  it("uses the fallback for untitled names", () => {
    expect(resolveQuizDisplayName("", "Quiz sans titre")).toBe("Quiz sans titre");
    expect(resolveQuizDisplayName("Quiz sans titre", "Quiz sans titre")).toBe(
      "Quiz sans titre",
    );
  });

  it("shows the real title when valid", () => {
    expect(resolveQuizDisplayName("Mon quiz", "Quiz sans titre")).toBe("Mon quiz");
  });
});
