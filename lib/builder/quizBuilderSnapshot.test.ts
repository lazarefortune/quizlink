import { describe, expect, it } from "vitest";

import type { QuizBuilder } from "@/types/quiz-builder";

import { computeQuizBuilderSnapshot } from "./quizBuilderSnapshot";

const quiz: QuizBuilder = {
  id: "quiz-1",
  name: "N",
  visibility: "PRIVATE",
  settings: {
    showAnswerImmediately: true,
    randomizeQuestions: false,
    randomizeOptions: false,
    timeLimitPerQuestion: null,
  },
  questions: [
    {
      id: "q1",
      type: "MULTIPLE_CHOICE",
      label: "L",
      options: [
        { id: "o1", label: "A", isCorrect: true },
        { id: "o2", label: "B", isCorrect: false },
      ],
    },
  ],
  createdBy: "USER",
  createdAt: new Date().toISOString(),
};

describe("computeQuizBuilderSnapshot", () => {
  it("is stable for the same quiz and time limit ui", () => {
    const ui = { enabled: false, minutes: 0, seconds: 0 };
    expect(computeQuizBuilderSnapshot(quiz, ui)).toBe(computeQuizBuilderSnapshot(quiz, ui));
  });

  it("changes when question imageKey changes", () => {
    const ui = { enabled: false, minutes: 0, seconds: 0 };
    const a = computeQuizBuilderSnapshot(quiz, ui);
    const withKey: QuizBuilder = {
      ...quiz,
      questions: [
        {
          ...quiz.questions[0]!,
          imageKey: "u/q/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp",
        },
      ],
    };
    const b = computeQuizBuilderSnapshot(withKey, ui);
    expect(a).not.toBe(b);
  });
});
