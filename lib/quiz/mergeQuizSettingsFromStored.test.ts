import { describe, expect, it } from "vitest";
import { mergeQuizSettingsFromStored } from "./mergeQuizSettingsFromStored";

describe("mergeQuizSettingsFromStored", () => {
  it("defaults autoSaveEnabled to true when absent from stored settings", () => {
    expect(mergeQuizSettingsFromStored({})).toMatchObject({ autoSaveEnabled: true });
  });

  it("defaults showAnswersAtEnd to true when absent (legacy quiz backward compat)", () => {
    expect(mergeQuizSettingsFromStored({})).toMatchObject({ showAnswersAtEnd: true });
  });

  it("preserves showAnswersAtEnd false", () => {
    expect(
      mergeQuizSettingsFromStored({
        showAnswerImmediately: true,
        showAnswersAtEnd: false,
        randomizeQuestions: false,
        randomizeOptions: false,
        timeLimitPerQuestion: null,
      }),
    ).toMatchObject({ showAnswersAtEnd: false });
  });

  it("preserves showAnswersAtEnd true when explicitly set", () => {
    expect(
      mergeQuizSettingsFromStored({
        showAnswerImmediately: false,
        showAnswersAtEnd: true,
        randomizeQuestions: false,
        randomizeOptions: false,
        timeLimitPerQuestion: null,
      }),
    ).toMatchObject({ showAnswersAtEnd: true });
  });

  it("preserves autoSaveEnabled false", () => {
    expect(
      mergeQuizSettingsFromStored({
        showAnswerImmediately: true,
        randomizeQuestions: false,
        randomizeOptions: false,
        timeLimitPerQuestion: null,
        autoSaveEnabled: false,
      }),
    ).toMatchObject({ autoSaveEnabled: false });
  });

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
