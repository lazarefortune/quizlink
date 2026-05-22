import { describe, expect, it } from "vitest";

import { DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS } from "@/lib/builder/defaultManualQuizSettings";
import type { QuizBuilder } from "@/types/quiz-builder";

import {
  buildQuizToSaveFromBuilderState,
  collectBuilderSaveValidationErrors,
} from "./builderQuizSavePrep";

const validQuiz: QuizBuilder = {
  id: "temp",
  name: "My quiz",
  visibility: "PRIVATE",
  questions: [
    {
      id: "q1",
      type: "MULTIPLE_CHOICE",
      label: "Question?",
      image: null,
      imageKey: null,
      explanation: null,
      options: [
        { id: "o1", label: "A", isCorrect: true },
        { id: "o2", label: "B", isCorrect: false },
      ],
    },
  ],
  settings: { ...DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS },
};

describe("builderQuizSavePrep", () => {
  it("returns no validation errors for a valid quiz", () => {
    expect(collectBuilderSaveValidationErrors(validQuiz, "none")).toEqual([]);
  });

  it("includes quiz name validation errors", () => {
    const errors = collectBuilderSaveValidationErrors(
      { ...validQuiz, name: "" },
      "none",
    );
    expect(errors.some((error) => error.field === "name")).toBe(true);
  });

  it("merges time limit into settings on buildQuizToSaveFromBuilderState", () => {
    const saved = buildQuizToSaveFromBuilderState(validQuiz, {
      enabled: true,
      minutes: 1,
      seconds: 0,
    });
    expect(saved.settings?.timeLimitPerQuestion).toBe(60);
  });
});
