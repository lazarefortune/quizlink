import { describe, expect, it } from "vitest";
import { resolveMobileQuizOptionsOpenAfterQuestionCountChange } from "./builder-mobile-quiz-options";

describe("resolveMobileQuizOptionsOpenAfterQuestionCountChange", () => {
  it("returns null when count is unchanged", () => {
    expect(resolveMobileQuizOptionsOpenAfterQuestionCountChange(0, 0)).toBeNull();
    expect(resolveMobileQuizOptionsOpenAfterQuestionCountChange(3, 3)).toBeNull();
  });

  it("returns null when count changes but neither side is zero", () => {
    expect(resolveMobileQuizOptionsOpenAfterQuestionCountChange(1, 2)).toBeNull();
    expect(resolveMobileQuizOptionsOpenAfterQuestionCountChange(4, 2)).toBeNull();
  });

  it("returns null when all questions were removed", () => {
    expect(resolveMobileQuizOptionsOpenAfterQuestionCountChange(1, 0)).toBeNull();
    expect(resolveMobileQuizOptionsOpenAfterQuestionCountChange(5, 0)).toBeNull();
  });

  it("returns false when the first question(s) appear from empty", () => {
    expect(resolveMobileQuizOptionsOpenAfterQuestionCountChange(0, 1)).toBe(false);
    expect(resolveMobileQuizOptionsOpenAfterQuestionCountChange(0, 12)).toBe(false);
  });
});
