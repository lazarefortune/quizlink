import { describe, expect, it } from "vitest";

import { computeBuilderValidationErrors } from "./computeBuilderValidationErrors";
import type { BuilderTimeLimitUi } from "@/lib/time-limit-seconds";
import type { QuizBuilder } from "@/types/quiz-builder";

const validQuiz: QuizBuilder = {
  id: "q1",
  name: "Quiz",
  visibility: "PRIVATE",
  settings: {
    showAnswerImmediately: false,
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
  createdAt: "2026-01-01T00:00:00.000Z",
};

const disabledTimeLimit: BuilderTimeLimitUi = {
  enabled: false,
  minutes: 0,
  seconds: 0,
};

describe("computeBuilderValidationErrors", () => {
  it("returns an empty list for a valid quiz with no time limit", () => {
    expect(computeBuilderValidationErrors(validQuiz, disabledTimeLimit)).toEqual([]);
  });

  it("returns quiz-level errors when present", () => {
    const errors = computeBuilderValidationErrors(
      { ...validQuiz, name: "" },
      disabledTimeLimit,
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "name" }),
      ]),
    );
  });

  it("appends the time-limit error to existing quiz errors", () => {
    const errors = computeBuilderValidationErrors(
      { ...validQuiz, name: "" },
      { enabled: true, minutes: 0, seconds: 0 },
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "name" }),
        expect.objectContaining({ field: "settings.timeLimitPerQuestion" }),
      ]),
    );
    expect(errors).toHaveLength(2);
  });

  it("includes the time-limit error alone when only the time limit is broken", () => {
    const errors = computeBuilderValidationErrors(validQuiz, {
      enabled: true,
      minutes: 0,
      seconds: 0,
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.field).toBe("settings.timeLimitPerQuestion");
  });
});
