import { describe, expect, it } from "vitest";
import {
  hasQuizOptionsPanelErrors,
  validateBuilderTimeLimit,
  validateQuiz,
  QUIZ_NAME_MAX_LENGTH,
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
    randomizeOptions: false,
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
      validateBuilderTimeLimit({ enabled: false, minutes: 0, seconds: 0 }),
    ).toBeNull();
  });

  it("returns null when enabled with valid parts", () => {
    expect(
      validateBuilderTimeLimit({ enabled: true, minutes: 1, seconds: 0 }),
    ).toBeNull();
    expect(
      validateBuilderTimeLimit({ enabled: true, minutes: 0, seconds: 45 }),
    ).toBeNull();
    expect(
      validateBuilderTimeLimit({ enabled: true, minutes: 1, seconds: 30 }),
    ).toBeNull();
  });

  it("returns an error when total is zero", () => {
    const err = validateBuilderTimeLimit({ enabled: true, minutes: 0, seconds: 0 });
    expect(err).not.toBeNull();
    expect(err?.field).toBe("settings.timeLimitPerQuestion");
    expect(err?.translationKey).toBe("builder.validation.timeLimitMustBePositive");
  });

  it("returns an error when seconds are out of range", () => {
    const err = validateBuilderTimeLimit({ enabled: true, minutes: 0, seconds: 60 });
    expect(err?.translationKey).toBe("builder.validation.timeLimitSecondsOutOfRange");
  });

  it("returns an error when minutes are out of range", () => {
    const err = validateBuilderTimeLimit({ enabled: true, minutes: 61, seconds: 0 });
    expect(err?.translationKey).toBe("builder.validation.timeLimitMinutesOutOfRange");
  });

  it("returns an error when total exceeds max", () => {
    const err = validateBuilderTimeLimit({ enabled: true, minutes: 60, seconds: 1 });
    expect(err?.translationKey).toBe("builder.validation.timeLimitMaxExceeded");
  });
});

describe("validateQuiz", () => {
  it("passes for minimal valid quiz", () => {
    expect(validateQuiz(minimalValidQuiz)).toHaveLength(0);
  });

  it("returns an error when quiz name exceeds max length", () => {
    const longName = "x".repeat(QUIZ_NAME_MAX_LENGTH + 1);
    const errors = validateQuiz({ ...minimalValidQuiz, name: longName });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "name",
          translationKey: "builder.validation.quizNameMaxLength",
          params: { max: QUIZ_NAME_MAX_LENGTH },
        }),
      ]),
    );
  });

  it("does not add max-length error when name is empty (trimmed)", () => {
    const errors = validateQuiz({ ...minimalValidQuiz, name: "" });
    expect(errors.some((e) => e.translationKey === "builder.validation.quizNameMaxLength")).toBe(
      false,
    );
  });

  it("emits only 'at least one correct' when no answer is correct on a single-choice question", () => {
    const errors = validateQuiz({
      ...minimalValidQuiz,
      questions: [
        {
          id: "qu1",
          type: "MULTIPLE_CHOICE",
          label: "Q1",
          options: [
            { id: "o1", label: "A", isCorrect: false },
            { id: "o2", label: "B", isCorrect: false },
          ],
        },
      ],
    });
    const correctnessErrors = errors.filter(
      (e) => e.field === "questions[0].correctAnswer",
    );
    expect(correctnessErrors).toHaveLength(1);
    expect(correctnessErrors[0]?.translationKey).toBe(
      "builder.validation.atLeastOneCorrectAnswer",
    );
  });

  it("emits 'exactly one correct' only when 2+ correct answers are picked on a single-choice question", () => {
    const errors = validateQuiz({
      ...minimalValidQuiz,
      questions: [
        {
          id: "qu1",
          type: "MULTIPLE_CHOICE",
          label: "Q1",
          options: [
            { id: "o1", label: "A", isCorrect: true },
            { id: "o2", label: "B", isCorrect: true },
          ],
        },
      ],
    });
    const correctnessErrors = errors.filter(
      (e) => e.field === "questions[0].correctAnswer",
    );
    expect(correctnessErrors).toHaveLength(1);
    expect(correctnessErrors[0]?.translationKey).toBe(
      "builder.validation.exactlyOneCorrectAnswer",
    );
  });

  it("does not emit 'exactly one correct' on CHECKBOX questions with multiple correct answers", () => {
    const errors = validateQuiz({
      ...minimalValidQuiz,
      questions: [
        {
          id: "qu1",
          type: "CHECKBOX",
          label: "Q1",
          options: [
            { id: "o1", label: "A", isCorrect: true },
            { id: "o2", label: "B", isCorrect: true },
          ],
        },
      ],
    });
    expect(
      errors.some(
        (e) => e.translationKey === "builder.validation.exactlyOneCorrectAnswer",
      ),
    ).toBe(false);
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
