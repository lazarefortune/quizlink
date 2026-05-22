import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.fn();
const mockQuizFindUnique = vi.fn();
const mockQuizLinkFindMany = vi.fn();
const mockQuizAttemptFindMany = vi.fn();
const mockQuizAttemptFindUnique = vi.fn();
const mockAnonymousStatsFindMany = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quiz: { findUnique: (...args: unknown[]) => mockQuizFindUnique(...args) },
    quizLink: { findMany: (...args: unknown[]) => mockQuizLinkFindMany(...args) },
    quizAttempt: {
      findMany: (...args: unknown[]) => mockQuizAttemptFindMany(...args),
      findUnique: (...args: unknown[]) => mockQuizAttemptFindUnique(...args),
    },
    quizLinkAnonymousStats: {
      findMany: (...args: unknown[]) => mockAnonymousStatsFindMany(...args),
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
  answers: [{ id: "ans-1" }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: ownerId } });
  mockAnonymousStatsFindMany.mockResolvedValue([]);
  mockQuizLinkFindMany.mockResolvedValue([]);
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
    mockQuizAttemptFindMany.mockResolvedValue([completedAnonymousAttempt]);

    const result = await getQuizStats(quizId);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.stats.totalResponses).toBe(1);
    expect(result.stats.globalScoreAverage).toBe(80);
    expect(result.stats.globalAverageDurationSeconds).toBe(300);
    expect(result.stats.attempts).toHaveLength(1);
    expect(result.stats.attempts[0]?.anonymousNumber).toBe(1);
    expect(mockQuizAttemptFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          quizLink: { quizId },
        }),
      }),
    );
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
    mockQuizAttemptFindMany.mockResolvedValue([]);

    const result = await getQuizStats(quizId);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.stats.totalResponses).toBe(0);
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

  it("getAttemptDetails returns answers with expired flag for owner", async () => {
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
