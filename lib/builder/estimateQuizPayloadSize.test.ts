import { describe, expect, it } from "vitest";

import type { QuizBuilder } from "@/types/quiz-builder";

import { estimateQuizPayloadSize } from "./estimateQuizPayloadSize";
import {
  QUIZ_SAVE_PAYLOAD_WARN_BYTES,
  QUIZ_SAVE_SERVER_ACTION_BODY_LIMIT_BYTES,
} from "./quizPayloadLimits";

const minimalQuiz: QuizBuilder = {
  id: "quiz-1",
  name: "N",
  visibility: "PRIVATE",
  settings: {
    showAnswerImmediately: true,
    randomizeQuestions: false,
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

describe("estimateQuizPayloadSize", () => {
  it("returns a small positive size for a minimal quiz", () => {
    const bytes = estimateQuizPayloadSize(minimalQuiz);
    expect(bytes).toBeGreaterThan(0);
    expect(bytes).toBeLessThan(50_000);
  });

  it("grows substantially when a large base64 image is attached", () => {
    const base = estimateQuizPayloadSize(minimalQuiz);
    const payload = "x".repeat(200_000);
    const heavy: QuizBuilder = {
      ...minimalQuiz,
      questions: minimalQuiz.questions.map((q, index) =>
        index === 0 ? { ...q, image: `data:image/png;base64,${payload}` } : q,
      ),
    };
    const next = estimateQuizPayloadSize(heavy);
    expect(next - base).toBeGreaterThan(190_000);
  });

  it("warn threshold stays below the configured server action body limit", () => {
    expect(QUIZ_SAVE_PAYLOAD_WARN_BYTES).toBeLessThan(
      QUIZ_SAVE_SERVER_ACTION_BODY_LIMIT_BYTES,
    );
  });

  it("uses UTF-8 byte length (non-ASCII expands vs raw char count)", () => {
    const ascii: QuizBuilder = {
      ...minimalQuiz,
      questions: [{ ...minimalQuiz.questions[0], label: "a".repeat(100) }],
    };
    const emoji: QuizBuilder = {
      ...minimalQuiz,
      questions: [{ ...minimalQuiz.questions[0], label: "\u{1F600}".repeat(100) }],
    };
    expect(estimateQuizPayloadSize(emoji)).toBeGreaterThan(
      estimateQuizPayloadSize(ascii),
    );
  });
});
