import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.fn();
const mockQuizFindUnique = vi.fn();
const mockQuizLinkFindMany = vi.fn();
const mockQuizLinkFindFirst = vi.fn();
const mockQuizAttemptFindMany = vi.fn();
const mockQuizAttemptFindUnique = vi.fn();
const mockQuizAttemptCount = vi.fn();
const mockQuizUnlockFindFirst = vi.fn();
const mockUserSubscriptionFindFirst = vi.fn();
const mockAnonymousStatsFindMany = vi.fn();
const mockQuizResponseStatsFindUnique = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quiz: { findUnique: (...args: unknown[]) => mockQuizFindUnique(...args) },
    quizLink: {
      findMany: (...args: unknown[]) => mockQuizLinkFindMany(...args),
      findFirst: (...args: unknown[]) => mockQuizLinkFindFirst(...args),
    },
    quizAttempt: {
      findMany: (...args: unknown[]) => mockQuizAttemptFindMany(...args),
      findUnique: (...args: unknown[]) => mockQuizAttemptFindUnique(...args),
      count: (...args: unknown[]) => mockQuizAttemptCount(...args),
    },
    quizUnlock: {
      findFirst: (...args: unknown[]) => mockQuizUnlockFindFirst(...args),
    },
    userSubscription: {
      findFirst: (...args: unknown[]) => mockUserSubscriptionFindFirst(...args),
    },
    quizLinkAnonymousStats: {
      findMany: (...args: unknown[]) => mockAnonymousStatsFindMany(...args),
    },
    quizResponseStats: {
      findUnique: (...args: unknown[]) => mockQuizResponseStatsFindUnique(...args),
    },
  },
}));

import {
  getAttemptDetails,
  getQuizQuestionInsights,
  getQuizStats,
} from "./actions";

const ownerId = "user-1";
const quizId = "quiz-1";

const completedAnonymousAttempt = {
  id: "att-1",
  participantId: null,
  identityMode: "ANONYMOUS",
  score: 80,
  status: "COMPLETED",
  startedAt: new Date("2026-05-20T10:00:00Z"),
  finishedAt: new Date("2026-05-20T10:05:00Z"),
  durationSeconds: 300,
  participant: null,
  quizLink: { detailsPurgedAt: null },
  _count: { answers: 1 },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: ownerId } });
  mockAnonymousStatsFindMany.mockResolvedValue([]);
  mockQuizLinkFindMany.mockResolvedValue([]);
  mockQuizLinkFindFirst.mockResolvedValue({
    responsesStartedAt: null,
    detailsPurgedAt: null,
  });
  mockQuizAttemptCount.mockResolvedValue(0);
  mockQuizUnlockFindFirst.mockResolvedValue(null);
  mockUserSubscriptionFindFirst.mockResolvedValue(null);
  mockQuizResponseStatsFindUnique.mockResolvedValue(null);
});

describe("quiz detail actions – responses", () => {
  it("getQuizStats returns DB attempts for quiz owner", async () => {
    mockQuizFindUnique.mockResolvedValue({
      ownerId,
      visibility: "PRIVATE",
      status: "ACTIVE",
      settings: {},
      createdAt: new Date(),
      _count: { questions: 2 },
    });
    mockQuizAttemptCount.mockResolvedValue(1);
    mockQuizAttemptFindMany
      .mockResolvedValueOnce([completedAnonymousAttempt])
      .mockResolvedValueOnce([completedAnonymousAttempt])
      .mockResolvedValueOnce([{ id: "att-1", startedAt: completedAnonymousAttempt.startedAt }]);

    const result = await getQuizStats(quizId);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.stats.totalResponses).toBe(1);
    expect(result.stats.totalAttemptCount).toBe(1);
    expect(result.stats.globalScoreAverage).toBe(80);
    expect(result.stats.globalAverageDurationSeconds).toBe(300);
    expect(result.stats.attempts).toHaveLength(1);
    expect(result.stats.lockedAttemptCount).toBe(0);
    expect(result.stats.attempts[0]?.anonymousNumber).toBe(1);
    expect(mockQuizAttemptCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          quizLink: { quizId },
        }),
      }),
    );
    const previewCall = mockQuizAttemptFindMany.mock.calls.find(
      (call) => (call[0] as { take?: number })?.take === 3,
    );
    expect(previewCall).toBeDefined();
    expect(previewCall?.[0]).toMatchObject({
      orderBy: { startedAt: "asc" },
      take: 3,
    });
  });

  it("getQuizStats uses response aggregates for simple KPIs when available", async () => {
    mockQuizFindUnique.mockResolvedValue({
      ownerId,
      visibility: "PRIVATE",
      status: "ACTIVE",
      settings: {},
      createdAt: new Date(),
      _count: { questions: 2 },
    });
    mockQuizAttemptCount.mockResolvedValue(1);
    mockQuizAttemptFindMany
      .mockResolvedValueOnce([completedAnonymousAttempt])
      .mockResolvedValueOnce([completedAnonymousAttempt])
      .mockResolvedValueOnce([{ id: "att-1", startedAt: completedAnonymousAttempt.startedAt }]);
    mockQuizResponseStatsFindUnique.mockResolvedValue({
      quizId,
      totalStarted: 10,
      totalCompleted: 8,
      totalAbandoned: 1,
      totalScore: 6,
      totalPossibleScore: 8,
      totalDurationSeconds: 2400,
      completedDurationCount: 8,
    });

    const result = await getQuizStats(quizId);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.stats.totalResponses).toBe(8);
    expect(result.stats.totalStarted).toBe(10);
    expect(result.stats.completionRatePercent).toBe(80);
    expect(result.stats.globalScoreAverage).toBe(75);
    expect(result.stats.globalAverageDurationSeconds).toBe(300);
    expect(result.stats.globalScoredCount).toBe(8);
  });

  it("getQuizStats falls back to attempt stats when aggregates are absent", async () => {
    mockQuizFindUnique.mockResolvedValue({
      ownerId,
      visibility: "PRIVATE",
      status: "ACTIVE",
      settings: {},
      createdAt: new Date(),
      _count: { questions: 2 },
    });
    mockQuizAttemptCount.mockResolvedValue(1);
    mockQuizAttemptFindMany
      .mockResolvedValueOnce([completedAnonymousAttempt])
      .mockResolvedValueOnce([completedAnonymousAttempt])
      .mockResolvedValueOnce([{ id: "att-1", startedAt: completedAnonymousAttempt.startedAt }]);
    mockQuizResponseStatsFindUnique.mockResolvedValue(null);

    const result = await getQuizStats(quizId);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.stats.totalResponses).toBe(1);
    expect(result.stats.globalScoreAverage).toBe(80);
    expect(result.stats.globalAverageDurationSeconds).toBe(300);
  });

  it("getQuizStats returns only 3 preview attempts when many exist", async () => {
    mockQuizFindUnique.mockResolvedValue({
      ownerId,
      visibility: "PRIVATE",
      status: "ACTIVE",
      settings: {},
      createdAt: new Date(),
      _count: { questions: 2 },
    });

    const manyAttempts = Array.from({ length: 10 }, (_, index) => ({
      ...completedAnonymousAttempt,
      id: `att-${index}`,
      startedAt: new Date(`2026-05-${10 + index}T10:00:00Z`),
    }));

    mockQuizAttemptCount.mockResolvedValue(10);
    mockQuizAttemptFindMany
      .mockResolvedValueOnce(manyAttempts)
      .mockResolvedValueOnce(manyAttempts.slice(0, 3))
      .mockResolvedValueOnce(
        manyAttempts.map((a) => ({ id: a.id, startedAt: a.startedAt })),
      );

    const result = await getQuizStats(quizId);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.stats.totalAttemptCount).toBe(10);
    expect(result.stats.attempts).toHaveLength(3);
    expect(result.stats.lockedAttemptCount).toBe(7);
    const attemptIds = result.stats.attempts.map((a) => a.id);
    expect(attemptIds).toEqual(["att-0", "att-1", "att-2"]);
    expect(attemptIds).not.toContain("att-9");
    for (const attempt of result.stats.attempts) {
      expect(attempt).not.toHaveProperty("answers");
      expect(attempt.participantLabel).toBeTruthy();
    }
  });

  it("getQuizStats rejects non-owner", async () => {
    mockQuizFindUnique.mockResolvedValue({
      ownerId: "other-user",
      visibility: "PRIVATE",
      status: "ACTIVE",
      settings: {},
      createdAt: new Date(),
      _count: { questions: 1 },
    });

    const result = await getQuizStats(quizId);
    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("getQuizStats returns empty attempts when no responses", async () => {
    mockQuizFindUnique.mockResolvedValue({
      ownerId,
      visibility: "PRIVATE",
      status: "ACTIVE",
      settings: {},
      createdAt: new Date(),
      _count: { questions: 1 },
    });
    mockQuizAttemptCount.mockResolvedValue(0);
    mockQuizAttemptFindMany.mockResolvedValue([]);

    const result = await getQuizStats(quizId);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.stats.totalResponses).toBe(0);
    expect(result.stats.totalAttemptCount).toBe(0);
    expect(result.stats.attempts).toEqual([]);
  });

  it("getQuizQuestionInsights includes anonymous completed attempts", async () => {
    mockQuizFindUnique.mockResolvedValue({
      ownerId,
      questions: [
        {
          id: "q1",
          options: [
            { id: "o1", label: "A", isCorrect: true },
            { id: "o2", label: "B", isCorrect: false },
          ],
        },
      ],
    });
    mockQuizAttemptFindMany.mockResolvedValue([
      {
        answers: [
          {
            questionId: "q1",
            isCorrect: true,
            expired: false,
            timeSpent: 12,
            selectedOptionIds: ["o1"],
          },
        ],
      },
    ]);

    const result = await getQuizQuestionInsights(quizId);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.insights[0]?.responseCount).toBe(1);
    expect(result.insights[0]?.successRate).toBe(100);
    expect(mockQuizAttemptFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "COMPLETED",
          quizLink: { quizId },
        }),
      }),
    );
  });

  it("getAttemptDetails rejects attempt outside free preview window", async () => {
    mockQuizLinkFindFirst.mockResolvedValue({
      responsesStartedAt: new Date("2026-05-01T12:00:00Z"),
    });
    mockQuizAttemptFindUnique.mockResolvedValue({
      id: "att-hidden",
      identityMode: "ANONYMOUS",
      participant: null,
      score: 50,
      status: "COMPLETED",
      startedAt: new Date(),
      finishedAt: new Date(),
      quizLink: {
        quizId,
        detailsPurgedAt: null,
        quiz: { ownerId, questions: [] },
      },
      answers: [],
    });
    mockQuizAttemptFindMany.mockResolvedValue([{ id: "att-visible" }]);

    const result = await getAttemptDetails("att-hidden");
    expect(result).toEqual({ success: false, error: "ATTEMPT_DETAILS_LOCKED" });
  });

  it("getAttemptDetails returns answers with expired flag for owner", async () => {
    mockQuizAttemptFindMany.mockResolvedValue([{ id: "att-1" }]);
    mockQuizAttemptFindUnique.mockResolvedValue({
      id: "att-1",
      identityMode: "ANONYMOUS",
      participant: null,
      score: 50,
      status: "COMPLETED",
      startedAt: new Date(),
      finishedAt: new Date(),
      quizLink: {
        quizId,
        detailsPurgedAt: null,
        quiz: {
          ownerId,
          questions: [{ id: "q1", order: 1 }],
        },
      },
      answers: [
        {
          question: {
            id: "q1",
            label: "Question?",
            options: [
              { id: "o1", label: "A", isCorrect: true },
              { id: "o2", label: "B", isCorrect: false },
            ],
          },
          selectedOptionIds: ["o2"],
          isCorrect: false,
          expired: true,
          timeSpent: 5,
        },
      ],
    });
    mockQuizAttemptFindMany.mockResolvedValue([
      { id: "att-1", startedAt: new Date("2026-05-20T10:00:00Z") },
    ]);

    const result = await getAttemptDetails("att-1");
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.attempt.participantName).toBe("Participant anonyme #1");
    expect(result.attempt.answers[0]?.expired).toBe(true);
    expect(result.attempt.answers[0]?.timeSpent).toBe(5);
  });

  it("getAttemptDetails returns participantName for PSEUDONYM public attempt", async () => {
    mockQuizAttemptFindMany.mockResolvedValue([{ id: "att-pseudo" }]);
    mockQuizAttemptFindUnique.mockResolvedValue({
      id: "att-pseudo",
      identityMode: "PSEUDONYM",
      participantId: null,
      participantName: "Camille",
      participantEmail: null,
      participant: null,
      score: 80,
      status: "COMPLETED",
      startedAt: new Date(),
      finishedAt: new Date(),
      quizLink: {
        quizId,
        detailsPurgedAt: null,
        quiz: {
          ownerId,
          questions: [{ id: "q1", order: 1 }],
        },
      },
      answers: [],
    });

    const result = await getAttemptDetails("att-pseudo");
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.attempt.participantName).toBe("Camille");
    expect(result.attempt.participantEmail).toBeNull();
  });

  it("getAttemptDetails returns purged error when detailed answers were deleted", async () => {
    mockQuizAttemptFindUnique.mockResolvedValue({
      id: "att-purged",
      identityMode: "ANONYMOUS",
      participant: null,
      score: 50,
      status: "COMPLETED",
      startedAt: new Date(),
      finishedAt: new Date(),
      quizLink: {
        quizId,
        detailsPurgedAt: new Date("2026-05-01T00:00:00Z"),
        quiz: { ownerId, questions: [] },
      },
      answers: [],
    });

    const result = await getAttemptDetails("att-purged");
    expect(result).toEqual({ success: false, error: "ATTEMPT_DETAILS_PURGED" });
  });

  it("getAttemptDetails rejects non-owner", async () => {
    mockQuizAttemptFindUnique.mockResolvedValue({
      id: "att-1",
      identityMode: "ANONYMOUS",
      participant: null,
      score: 50,
      status: "COMPLETED",
      startedAt: new Date(),
      finishedAt: new Date(),
      quizLink: {
        quizId,
        quiz: { ownerId: "other", questions: [] },
      },
      answers: [],
    });

    const result = await getAttemptDetails("att-1");
    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });
});
