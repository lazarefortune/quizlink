import { describe, expect, it } from "vitest";
import { validateBuilderTimeLimit, validateQuiz } from "./quiz-validation";
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
