import { describe, expect, it } from "vitest";
import {
  hasQuizOptionsPanelErrors,
  validateBuilderTimeLimit,
  validateQuiz,
  type ValidationError,
} from "./quiz-validation";
import type { QuizBuilder } from "@/types/quiz-builder";

const minimalValidQuiz: QuizBuilder = {
  id: "q1",
  name: "Test",
  visibility: "PRIVATE",
  settings: {
    showAnswerImmediately: true,
    randomizeQuestions: false,
    timeLimitPerQuestion: null,
  },
  questions: [
    {
      id: "qu1",
      type: "MULTIPLE_CHOICE",
      label: "Q1",
      options: [
        { id: "o1", label: "A", isCorrect: true },
        { id: "o2", label: "B", isCorrect: false },
      ],
    },
  ],
  createdBy: "USER",
  createdAt: new Date().toISOString(),
};

describe("validateBuilderTimeLimit", () => {
  it("returns null when time limit is disabled", () => {
    expect(
      validateBuilderTimeLimit({ enabled: false, inputValue: "" }),
    ).toBeNull();
  });

  it("returns null when enabled with valid seconds", () => {
    expect(
      validateBuilderTimeLimit({ enabled: true, inputValue: "60" }),
    ).toBeNull();
  });

  it("returns an error when enabled but input empty", () => {
    const err = validateBuilderTimeLimit({ enabled: true, inputValue: "" });
    expect(err).not.toBeNull();
    expect(err?.field).toBe("settings.timeLimitPerQuestion");
    expect(err?.translationKey).toBe("builder.validation.timeLimitInvalid");
  });

  it("returns an error when enabled but value out of range", () => {
    const err = validateBuilderTimeLimit({ enabled: true, inputValue: "99999" });
    expect(err).not.toBeNull();
  });
});

describe("validateQuiz", () => {
  it("passes for minimal valid quiz", () => {
    expect(validateQuiz(minimalValidQuiz)).toHaveLength(0);
  });
});

describe("hasQuizOptionsPanelErrors", () => {
  it("is false for empty errors", () => {
    expect(hasQuizOptionsPanelErrors([])).toBe(false);
  });

  it("is true when name field has an error", () => {
    const errors: ValidationError[] = [
      {
        field: "name",
        translationKey: "builder.validation.quizNameRequired",
      },
    ];
    expect(hasQuizOptionsPanelErrors(errors)).toBe(true);
  });

  it("is true when a settings field has an error", () => {
    const errors: ValidationError[] = [
      {
        field: "settings.timeLimitPerQuestion",
        translationKey: "builder.validation.timeLimitInvalid",
      },
    ];
    expect(hasQuizOptionsPanelErrors(errors)).toBe(true);
  });

  it("is false when only question-level errors exist", () => {
    const errors: ValidationError[] = [
      {
        field: "questions[0].label",
        translationKey: "builder.validation.questionLabelRequired",
        params: { number: 1 },
      },
    ];
    expect(hasQuizOptionsPanelErrors(errors)).toBe(false);
  });
});
