import { describe, expect, it } from "vitest";
import { mergeQuizSettingsFromStored } from "./mergeQuizSettingsFromStored";

describe("mergeQuizSettingsFromStored", () => {
  it("applies randomizeOptions fallback from randomizeQuestions when missing", () => {
    expect(
      mergeQuizSettingsFromStored({
        randomizeQuestions: true,
        showAnswerImmediately: false,
        timeLimitPerQuestion: null,
      }),
    ).toMatchObject({
      randomizeQuestions: true,
      randomizeOptions: true,
    });
  });

  it("keeps explicit randomizeOptions", () => {
    expect(
      mergeQuizSettingsFromStored({
        randomizeQuestions: true,
        randomizeOptions: false,
        showAnswerImmediately: true,
        timeLimitPerQuestion: null,
      }),
    ).toMatchObject({
      randomizeQuestions: true,
      randomizeOptions: false,
    });
  });
});
