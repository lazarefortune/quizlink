import { beforeEach, describe, expect, it, vi } from "vitest";

const mockQuizResponseStatsUpsert = vi.fn();
const mockQuizResponseStatsFindUnique = vi.fn();
const mockQuizQuestionResponseStatsUpsert = vi.fn();
const mockQuizAttemptUpdateMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quizResponseStats: {
      upsert: (...args: unknown[]) => mockQuizResponseStatsUpsert(...args),
      findUnique: (...args: unknown[]) => mockQuizResponseStatsFindUnique(...args),
    },
    quizQuestionResponseStats: {
      upsert: (...args: unknown[]) => mockQuizQuestionResponseStatsUpsert(...args),
    },
    quizAttempt: {
      updateMany: (...args: unknown[]) => mockQuizAttemptUpdateMany(...args),
    },
  },
}));

import {
  getQuizResponseAggregates,
  incrementQuestionAnswerAggregates,
  incrementQuizAbandonedAggregate,
  incrementQuizCompletedAggregate,
  incrementQuizStartedAggregate,
  transitionAttemptToAbandoned,
  transitionAttemptToCompleted,
} from "./quiz-response-aggregates";

const quizId = "quiz-1";

beforeEach(() => {
  vi.clearAllMocks();
  mockQuizResponseStatsUpsert.mockResolvedValue({});
  mockQuizQuestionResponseStatsUpsert.mockResolvedValue({});
  mockQuizAttemptUpdateMany.mockResolvedValue({ count: 1 });
});

describe("incrementQuizStartedAggregate", () => {
  it("upserts totalStarted +1", async () => {
    await incrementQuizStartedAggregate(quizId);

    expect(mockQuizResponseStatsUpsert).toHaveBeenCalledWith({
      where: { quizId },
      create: { quizId, totalStarted: 1 },
      update: { totalStarted: { increment: 1 } },
    });
  });
});

describe("incrementQuizCompletedAggregate", () => {
  it("stores score and duration for a completed attempt", async () => {
    await incrementQuizCompletedAggregate(quizId, {
      score: 50,
      totalQuestions: 2,
      durationSeconds: 120,
    });

    expect(mockQuizResponseStatsUpsert).toHaveBeenCalledWith({
      where: { quizId },
      create: {
        quizId,
        totalCompleted: 1,
        totalScore: 1,
        totalPossibleScore: 2,
        totalDurationSeconds: 120,
        completedDurationCount: 1,
      },
      update: {
        totalCompleted: { increment: 1 },
        totalScore: { increment: 1 },
        totalPossibleScore: { increment: 2 },
        totalDurationSeconds: { increment: 120 },
        completedDurationCount: { increment: 1 },
      },
    });
  });

  it("skips duration fields when durationSeconds is null", async () => {
    await incrementQuizCompletedAggregate(quizId, {
      score: 100,
      totalQuestions: 1,
      durationSeconds: null,
    });

    expect(mockQuizResponseStatsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          completedDurationCount: 0,
          totalDurationSeconds: 0,
        }),
        update: expect.not.objectContaining({
          completedDurationCount: expect.anything(),
        }),
      }),
    );
  });
});

describe("incrementQuizAbandonedAggregate", () => {
  it("upserts totalAbandoned +1", async () => {
    await incrementQuizAbandonedAggregate(quizId);

    expect(mockQuizResponseStatsUpsert).toHaveBeenCalledWith({
      where: { quizId },
      create: { quizId, totalAbandoned: 1 },
      update: { totalAbandoned: { increment: 1 } },
    });
  });
});

describe("incrementQuestionAnswerAggregates", () => {
  it("increments correct and expired answer stats", async () => {
    await incrementQuestionAnswerAggregates(quizId, [
      {
        questionId: "q1",
        isCorrect: true,
        expired: false,
        timeSpentSeconds: 10,
      },
      {
        questionId: "q2",
        isCorrect: false,
        expired: true,
        timeSpentSeconds: null,
      },
    ]);

    expect(mockQuizQuestionResponseStatsUpsert).toHaveBeenCalledTimes(2);
    expect(mockQuizQuestionResponseStatsUpsert).toHaveBeenNthCalledWith(1, {
      where: { quizId_questionId: { quizId, questionId: "q1" } },
      create: {
        quizId,
        questionId: "q1",
        totalAnswers: 1,
        correctAnswers: 1,
        expiredAnswers: 0,
        totalTimeSpentSeconds: 10,
        timeSpentCount: 1,
      },
      update: {
        totalAnswers: { increment: 1 },
        correctAnswers: { increment: 1 },
        totalTimeSpentSeconds: { increment: 10 },
        timeSpentCount: { increment: 1 },
      },
    });
    expect(mockQuizQuestionResponseStatsUpsert).toHaveBeenNthCalledWith(2, {
      where: { quizId_questionId: { quizId, questionId: "q2" } },
      create: {
        quizId,
        questionId: "q2",
        totalAnswers: 1,
        correctAnswers: 0,
        expiredAnswers: 1,
        totalTimeSpentSeconds: 0,
        timeSpentCount: 0,
      },
      update: {
        totalAnswers: { increment: 1 },
        expiredAnswers: { increment: 1 },
      },
    });
  });
});

describe("transitionAttemptToCompleted", () => {
  it("updates only IN_PROGRESS attempts", async () => {
    const finishedAt = new Date("2026-05-20T10:05:00Z");

    const transitioned = await transitionAttemptToCompleted("att-1", {
      finishedAt,
      score: 80,
      durationSeconds: 300,
      totalQuestions: 5,
    });

    expect(transitioned).toBe(true);
    expect(mockQuizAttemptUpdateMany).toHaveBeenCalledWith({
      where: { id: "att-1", status: "IN_PROGRESS" },
      data: {
        status: "COMPLETED",
        finishedAt,
        score: 80,
        durationSeconds: 300,
        totalQuestions: 5,
      },
    });
  });

  it("returns false when attempt was already finalized", async () => {
    mockQuizAttemptUpdateMany.mockResolvedValue({ count: 0 });

    const transitioned = await transitionAttemptToCompleted("att-1", {
      finishedAt: new Date(),
      score: 80,
      durationSeconds: 300,
      totalQuestions: 5,
    });

    expect(transitioned).toBe(false);
  });
});

describe("transitionAttemptToAbandoned", () => {
  it("updates only IN_PROGRESS attempts", async () => {
    const finishedAt = new Date("2026-05-20T10:05:00Z");

    const transitioned = await transitionAttemptToAbandoned("att-1", {
      finishedAt,
      durationSeconds: 120,
    });

    expect(transitioned).toBe(true);
    expect(mockQuizAttemptUpdateMany).toHaveBeenCalledWith({
      where: { id: "att-1", status: "IN_PROGRESS" },
      data: {
        status: "ABANDONED",
        finishedAt,
        durationSeconds: 120,
      },
    });
  });

  it("returns false on double abandon", async () => {
    mockQuizAttemptUpdateMany.mockResolvedValue({ count: 0 });

    const transitioned = await transitionAttemptToAbandoned("att-1", {
      finishedAt: new Date(),
      durationSeconds: 120,
    });

    expect(transitioned).toBe(false);
  });
});

describe("getQuizResponseAggregates", () => {
  it("returns null when no aggregate row exists", async () => {
    mockQuizResponseStatsFindUnique.mockResolvedValue(null);

    const result = await getQuizResponseAggregates(quizId);
    expect(result).toBeNull();
  });

  it("computes derived KPIs from stored totals", async () => {
    mockQuizResponseStatsFindUnique.mockResolvedValue({
      quizId,
      totalStarted: 4,
      totalCompleted: 2,
      totalAbandoned: 1,
      totalScore: 3,
      totalPossibleScore: 4,
      totalDurationSeconds: 600,
      completedDurationCount: 2,
    });

    const result = await getQuizResponseAggregates(quizId);

    expect(result).toEqual({
      quizId,
      totalStarted: 4,
      totalCompleted: 2,
      totalAbandoned: 1,
      averageScorePercent: 75,
      averageDurationSeconds: 300,
      completionRatePercent: 50,
    });
  });
});
