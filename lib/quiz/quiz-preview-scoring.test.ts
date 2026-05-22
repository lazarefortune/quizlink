import { describe, expect, it } from "vitest";

import {
  computeQuizPreviewFinishResult,
  gradeQuizPreviewAnswer,
  type QuizPreviewQuestion,
} from "./quiz-preview-scoring";

const baseQuestion: QuizPreviewQuestion = {
  id: "q1",
  order: 0,
  type: "MULTIPLE_CHOICE",
  label: "<p>Question</p>",
  image: null,
  imageKey: null,
  explanation: "Because",
  options: [
    { id: "a", label: "A", isCorrect: true },
    { id: "b", label: "B", isCorrect: false },
  ],
};

describe("gradeQuizPreviewAnswer", () => {
  it("returns correct option ids only when showAnswerImmediately is true", () => {
    const withReveal = gradeQuizPreviewAnswer(baseQuestion, ["a"], true);
    expect(withReveal.isCorrect).toBe(true);
    expect(withReveal.correctOptionIds).toEqual(["a"]);

    const withoutReveal = gradeQuizPreviewAnswer(baseQuestion, ["a"], false);
    expect(withoutReveal.isCorrect).toBe(true);
    expect(withoutReveal.correctOptionIds).toBeUndefined();
  });
});

describe("computeQuizPreviewFinishResult", () => {
  it("computes score and details without persisting", () => {
    const result = computeQuizPreviewFinishResult(
      [baseQuestion],
      [{ questionId: "q1", selectedOptionIds: ["a"] }],
      { showAnswersAtEnd: true },
    );

    expect(result.score).toBe(100);
    expect(result.correctAnswersCount).toBe(1);
    expect(result.details[0]?.isCorrect).toBe(true);
    expect(result.showAnswersAtEnd).toBe(true);
  });

  it("preserves showAnswersAtEnd false for results UI", () => {
    const result = computeQuizPreviewFinishResult(
      [baseQuestion],
      [{ questionId: "q1", selectedOptionIds: ["b"] }],
      { showAnswersAtEnd: false },
    );

    expect(result.showAnswersAtEnd).toBe(false);
    expect(result.score).toBe(0);
  });
});
