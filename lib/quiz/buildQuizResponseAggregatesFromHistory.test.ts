import { describe, expect, it } from "vitest";

import {
  buildQuestionResponseStatsFromHistory,
  buildQuizAggregatesFromHistory,
  buildQuizResponseStatsFromHistory,
  computeCorrectAnswersFromScore,
  resolveCompletedAttemptTotalQuestions,
} from "./buildQuizResponseAggregatesFromHistory";

const quizId = "quiz-1";

describe("buildQuizResponseStatsFromHistory", () => {
  it("returns null when quiz has no attempts", () => {
    expect(buildQuizResponseStatsFromHistory(quizId, [])).toBeNull();
  });

  it("counts started, completed, abandoned, score and duration", () => {
    const result = buildQuizResponseStatsFromHistory(quizId, [
      {
        id: "a1",
        status: "COMPLETED",
        score: 50,
        totalQuestions: 2,
        durationSeconds: 120,
        answerCount: 2,
      },
      {
        id: "a2",
        status: "ABANDONED",
        score: null,
        totalQuestions: null,
        durationSeconds: 30,
      },
      {
        id: "a3",
        status: "IN_PROGRESS",
        score: null,
        totalQuestions: null,
        durationSeconds: null,
      },
    ]);

    expect(result).toEqual({
      quizId,
      totalStarted: 3,
      totalCompleted: 1,
      totalAbandoned: 1,
      totalScore: 1,
      totalPossibleScore: 2,
      totalDurationSeconds: 120,
      completedDurationCount: 1,
    });
  });

  it("ignores null scores for completed attempts", () => {
    const result = buildQuizResponseStatsFromHistory(quizId, [
      {
        id: "a1",
        status: "COMPLETED",
        score: null,
        totalQuestions: 4,
        durationSeconds: null,
      },
    ]);

    expect(result).toEqual({
      quizId,
      totalStarted: 1,
      totalCompleted: 1,
      totalAbandoned: 0,
      totalScore: 0,
      totalPossibleScore: 0,
      totalDurationSeconds: 0,
      completedDurationCount: 0,
    });
  });

  it("falls back to answerCount when totalQuestions is missing", () => {
    const result = buildQuizResponseStatsFromHistory(quizId, [
      {
        id: "a1",
        status: "COMPLETED",
        score: 100,
        totalQuestions: null,
        durationSeconds: 60,
        answerCount: 3,
      },
    ]);

    expect(result?.totalScore).toBe(3);
    expect(result?.totalPossibleScore).toBe(3);
  });
});

describe("buildQuestionResponseStatsFromHistory", () => {
  it("aggregates correct, incorrect and expired answers with time spent", () => {
    const result = buildQuestionResponseStatsFromHistory(quizId, [
      {
        questionId: "q1",
        isCorrect: true,
        expired: false,
        timeSpentSeconds: 10,
      },
      {
        questionId: "q1",
        isCorrect: false,
        expired: true,
        timeSpentSeconds: null,
      },
      {
        questionId: "q2",
        isCorrect: false,
        expired: false,
        timeSpentSeconds: 5,
      },
    ]);

    expect(result).toEqual([
      {
        quizId,
        questionId: "q1",
        totalAnswers: 2,
        correctAnswers: 1,
        expiredAnswers: 1,
        totalTimeSpentSeconds: 10,
        timeSpentCount: 1,
      },
      {
        quizId,
        questionId: "q2",
        totalAnswers: 1,
        correctAnswers: 0,
        expiredAnswers: 0,
        totalTimeSpentSeconds: 5,
        timeSpentCount: 1,
      },
    ]);
  });
});

describe("buildQuizAggregatesFromHistory", () => {
  it("combines global and per-question aggregates", () => {
    const result = buildQuizAggregatesFromHistory({
      quizId,
      attempts: [
        {
          id: "a1",
          status: "COMPLETED",
          score: 100,
          totalQuestions: 1,
          durationSeconds: 45,
          answerCount: 1,
        },
      ],
      answersFromCompletedAttempts: [
        {
          questionId: "q1",
          isCorrect: true,
          expired: false,
          timeSpentSeconds: 12,
        },
      ],
    });

    expect(result.responseStats?.totalCompleted).toBe(1);
    expect(result.questionStats).toHaveLength(1);
    expect(result.questionStats[0]?.correctAnswers).toBe(1);
  });
});

describe("helpers", () => {
  it("resolveCompletedAttemptTotalQuestions prefers stored totalQuestions", () => {
    expect(
      resolveCompletedAttemptTotalQuestions({ totalQuestions: 5 }, 2),
    ).toBe(5);
    expect(
      resolveCompletedAttemptTotalQuestions({ totalQuestions: null }, 2),
    ).toBe(2);
  });

  it("computeCorrectAnswersFromScore matches live increment formula", () => {
    expect(computeCorrectAnswersFromScore(50, 2)).toBe(1);
    expect(computeCorrectAnswersFromScore(100, 3)).toBe(3);
  });
});
