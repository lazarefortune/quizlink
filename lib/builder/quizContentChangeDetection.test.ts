import { describe, it, expect } from "vitest";

import {
  buildPlayableContentMultisetKey,
  hasQuizPlayableContentChanged,
} from "./quizContentChangeDetection";
import type { Question, QuizBuilder } from "@/types/quiz-builder";

const baseSettings = {
  showAnswerImmediately: false,
  randomizeQuestions: false,
  randomizeOptions: false,
  timeLimitPerQuestion: null as number | null,
};

function makeQuiz(overrides: {
  name?: string;
  settings?: typeof baseSettings;
  questions: Question[];
}): QuizBuilder {
  return {
    id: "quiz-1",
    name: overrides.name ?? "Quiz",
    visibility: "PRIVATE",
    settings: overrides.settings ?? { ...baseSettings },
    questions: overrides.questions,
    createdBy: "USER",
    createdAt: "2025-01-01T00:00:00.000Z",
  };
}

const q1: Question = {
  id: "q-a",
  type: "MULTIPLE_CHOICE",
  label: "One?",
  options: [
    { id: "o1", label: "Yes", isCorrect: true },
    { id: "o2", label: "No", isCorrect: false },
  ],
};

const q2: Question = {
  id: "q-b",
  type: "MULTIPLE_CHOICE",
  label: "Two?",
  options: [
    { id: "o3", label: "A", isCorrect: false },
    { id: "o4", label: "B", isCorrect: true },
  ],
};

describe("hasQuizPlayableContentChanged / buildPlayableContentMultisetKey", () => {
  it("returns false when only the quiz name changes", () => {
    const prev = makeQuiz({ questions: [q1] });
    const next = makeQuiz({ name: "Renamed", questions: [q1] });
    expect(hasQuizPlayableContentChanged(prev, next)).toBe(false);
  });

  it("returns false when only settings change", () => {
    const prev = makeQuiz({ questions: [q1] });
    const next = makeQuiz({
      questions: [q1],
      settings: {
        ...baseSettings,
        showAnswerImmediately: true,
        randomizeQuestions: true,
        randomizeOptions: true,
        timeLimitPerQuestion: 42,
      },
    });
    expect(hasQuizPlayableContentChanged(prev, next)).toBe(false);
  });

  it("returns true when a question label changes", () => {
    const prev = makeQuiz({ questions: [q1] });
    const next = makeQuiz({
      questions: [{ ...q1, label: "Changed?" }],
    });
    expect(hasQuizPlayableContentChanged(prev, next)).toBe(true);
  });

  it("returns true when an option label changes", () => {
    const prev = makeQuiz({ questions: [q1] });
    const next = makeQuiz({
      questions: [
        {
          ...q1,
          options: [
            { id: "o1", label: "Yep", isCorrect: true },
            { id: "o2", label: "No", isCorrect: false },
          ],
        },
      ],
    });
    expect(hasQuizPlayableContentChanged(prev, next)).toBe(true);
  });

  it("returns true when the correct answer flag changes", () => {
    const prev = makeQuiz({ questions: [q1] });
    const next = makeQuiz({
      questions: [
        {
          ...q1,
          options: [
            { id: "o1", label: "Yes", isCorrect: false },
            { id: "o2", label: "No", isCorrect: true },
          ],
        },
      ],
    });
    expect(hasQuizPlayableContentChanged(prev, next)).toBe(true);
  });

  it("returns true when explanation changes", () => {
    const prev = makeQuiz({ questions: [q1] });
    const next = makeQuiz({
      questions: [{ ...q1, explanation: "Hint" }],
    });
    expect(hasQuizPlayableContentChanged(prev, next)).toBe(true);
  });

  it("returns true when imageKey changes", () => {
    const prev = makeQuiz({ questions: [q1] });
    const next = makeQuiz({
      questions: [
        {
          ...q1,
          imageKey: "user/quiz/a.png",
        },
      ],
    });
    expect(hasQuizPlayableContentChanged(prev, next)).toBe(true);
  });

  it("returns false when only question order changes with identical content", () => {
    const prev = makeQuiz({ questions: [q1, q2] });
    const next = makeQuiz({
      questions: [
        { ...q2, id: "x2" },
        { ...q1, id: "x1" },
      ],
    });
    expect(hasQuizPlayableContentChanged(prev, next)).toBe(false);
    expect(buildPlayableContentMultisetKey(prev)).toBe(buildPlayableContentMultisetKey(next));
  });

  it("returns false when only option order changes with identical content", () => {
    const prev = makeQuiz({ questions: [q1] });
    const next = makeQuiz({
      questions: [
        {
          ...q1,
          options: [
            { id: "z2", label: "No", isCorrect: false },
            { id: "z1", label: "Yes", isCorrect: true },
          ],
        },
      ],
    });
    expect(hasQuizPlayableContentChanged(prev, next)).toBe(false);
  });

  it("returns true when a question is added", () => {
    const prev = makeQuiz({ questions: [q1] });
    const next = makeQuiz({ questions: [q1, q2] });
    expect(hasQuizPlayableContentChanged(prev, next)).toBe(true);
  });

  it("returns true when a question is removed", () => {
    const prev = makeQuiz({ questions: [q1, q2] });
    const next = makeQuiz({ questions: [q1] });
    expect(hasQuizPlayableContentChanged(prev, next)).toBe(true);
  });
});
