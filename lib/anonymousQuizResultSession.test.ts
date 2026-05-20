// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAnonymousQuizResultFromSession,
  loadAnonymousQuizResultFromSession,
  saveAnonymousQuizResultToSession,
  type AnonymousQuizResultSession,
} from "./anonymousQuizResultSession";

const token = "token-123";

const fixture: AnonymousQuizResultSession = {
  quizId: "quiz-1",
  quizName: "Science Quiz",
  score: 50,
  totalQuestions: 2,
  correctAnswersCount: 1,
  showAnswerImmediately: true,
  details: [
    {
      questionId: "q1",
      questionLabel: "Question 1",
      questionImage: null,
      isCorrect: true,
      selectedOptionIds: ["o1"],
      selectedOptionLabels: ["Answer 1"],
      correctOptionIds: ["o1"],
      correctOptionLabels: ["Answer 1"],
      explanation: null,
      timeSpent: 5,
    },
  ],
  savedAt: Date.now(),
};

describe("anonymousQuizResultSession", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("saves and loads result from sessionStorage", () => {
    saveAnonymousQuizResultToSession(token, fixture);

    const loaded = loadAnonymousQuizResultFromSession(token);
    expect(loaded).toEqual(fixture);
  });

  it("returns null for invalid payload", () => {
    window.sessionStorage.setItem("anonymous-quiz-result:token-123", "not-json");

    const loaded = loadAnonymousQuizResultFromSession(token);
    expect(loaded).toBeNull();
  });

  it("clears saved result", () => {
    saveAnonymousQuizResultToSession(token, fixture);
    clearAnonymousQuizResultFromSession(token);

    const loaded = loadAnonymousQuizResultFromSession(token);
    expect(loaded).toBeNull();
  });

  it("round-trips when showAnswerImmediately is false", () => {
    const result: AnonymousQuizResultSession = {
      ...fixture,
      showAnswerImmediately: false,
    };
    saveAnonymousQuizResultToSession(token, result);

    const loaded = loadAnonymousQuizResultFromSession(token);
    expect(loaded?.showAnswerImmediately).toBe(false);
  });

  it("round-trips when showAnswersAtEnd is false", () => {
    const result: AnonymousQuizResultSession = {
      ...fixture,
      showAnswersAtEnd: false,
    };
    saveAnonymousQuizResultToSession(token, result);

    const loaded = loadAnonymousQuizResultFromSession(token);
    expect(loaded?.showAnswersAtEnd).toBe(false);
  });

  it("loads previously stored session without showAnswersAtEnd (legacy backward compat)", () => {
    const legacyPayload = {
      quizId: "quiz-legacy",
      quizName: "Legacy quiz",
      score: 100,
      totalQuestions: 1,
      correctAnswersCount: 1,
      details: [],
      savedAt: Date.now(),
    };
    window.sessionStorage.setItem(
      `anonymous-quiz-result:${token}`,
      JSON.stringify(legacyPayload),
    );

    const loaded = loadAnonymousQuizResultFromSession(token);
    expect(loaded).not.toBeNull();
    expect(loaded?.showAnswersAtEnd).toBeUndefined();
  });
});
