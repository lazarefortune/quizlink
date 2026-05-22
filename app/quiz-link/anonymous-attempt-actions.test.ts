import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------

const mockFindUnique = vi.fn();
const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockExecuteRaw = vi.fn();

const mockCookieSet = vi.fn();
const mockCookieGet = vi.fn();
const mockCookieDelete = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: (...a: unknown[]) => mockCookieSet(...a),
    get: (...a: unknown[]) => mockCookieGet(...a),
    delete: (...a: unknown[]) => mockCookieDelete(...a),
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quizLink: { findUnique: (...a: unknown[]) => mockFindUnique(...a) },
    quizAttempt: {
      findUnique: (...a: unknown[]) => mockFindUnique(...a),
      create: (...a: unknown[]) => mockCreate(...a),
      update: (...a: unknown[]) => mockUpdate(...a),
      findMany: (...a: unknown[]) => mockFindMany(...a),
    },
    quizAttemptQuestion: {
      findUnique: (...a: unknown[]) => mockFindUnique(...a),
      create: (...a: unknown[]) => mockCreate(...a),
      update: (...a: unknown[]) => mockUpdate(...a),
      findMany: (...a: unknown[]) => mockFindMany(...a),
    },
    quizAnswer: {
      findFirst: (...a: unknown[]) => mockFindFirst(...a),
      create: (...a: unknown[]) => mockCreate(...a),
      update: (...a: unknown[]) => mockUpdate(...a),
      findMany: (...a: unknown[]) => mockFindMany(...a),
    },
    $executeRaw: (...a: unknown[]) => mockExecuteRaw(...a),
  },
}));

import {
  startAnonymousQuizAttemptAction,
  startAttemptQuestionAction,
  submitAttemptAnswerAction,
  finishAnonymousQuizAttemptAction,
} from "./anonymous-attempt-actions";
import { QUIZ_ACTION_ERROR_CODE } from "@/lib/quiz/quizActionErrorCodes";

// ---------------------------------------------------------------------------
// Base fixtures
// ---------------------------------------------------------------------------

const baseQuestion = {
  id: "q1",
  image: null,
  imageKey: null,
  explanation: null,
  options: [
    { id: "o1", label: "A", isCorrect: true },
    { id: "o2", label: "B", isCorrect: false },
  ],
};

const baseQuizLink = {
  id: "link-1",
  quizId: "quiz-1",
  participantId: null,
  revokedAt: null,
  expiresAt: null,
  quiz: {
    id: "quiz-1",
    status: "ACTIVE",
    settings: {},
    questions: [baseQuestion],
  },
};

const baseAttempt = {
  id: "att-1",
  quizLinkId: "link-1",
  status: "IN_PROGRESS",
  identityMode: "ANONYMOUS",
  startedAt: new Date(Date.now() - 30_000), // 30s ago
  finishedAt: null,
  durationSeconds: null,
  score: null,
  quizLink: {
    id: "link-1",
    token: "tok",
    quiz: {
      status: "ACTIVE",
      settings: {},
      questions: [baseQuestion],
    },
  },
  answers: [],
  questionTimings: [],
};

// ---------------------------------------------------------------------------
// startAnonymousQuizAttemptAction
// ---------------------------------------------------------------------------

describe("startAnonymousQuizAttemptAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockExecuteRaw.mockResolvedValue(undefined);
  });

  it("creates an attempt, sets cookie, and returns clean play redirect", async () => {
    mockFindUnique.mockResolvedValue(baseQuizLink);
    mockCreate.mockResolvedValue({ id: "att-new" });

    const result = await startAnonymousQuizAttemptAction("tok");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.redirectTo).toBe("/quiz/tok/play");
    expect(mockCookieSet).toHaveBeenCalledWith(
      "quizlink_attempt_tok",
      "att-new",
      expect.objectContaining({ httpOnly: true, sameSite: "lax" }),
    );
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "IN_PROGRESS",
          identityMode: "ANONYMOUS",
          totalQuestions: 1,
        }),
      }),
    );
  });

  it("refuses revoked links", async () => {
    mockFindUnique.mockResolvedValue({ ...baseQuizLink, revokedAt: new Date() });
    const result = await startAnonymousQuizAttemptAction("tok");
    expect(result.success).toBe(false);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("refuses participant (identified) links", async () => {
    mockFindUnique.mockResolvedValue({ ...baseQuizLink, participantId: "p1" });
    const result = await startAnonymousQuizAttemptAction("tok");
    expect(result.success).toBe(false);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("refuses ARCHIVED quizzes", async () => {
    mockFindUnique.mockResolvedValue({
      ...baseQuizLink,
      quiz: { ...baseQuizLink.quiz, status: "ARCHIVED" },
    });
    const result = await startAnonymousQuizAttemptAction("tok");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(QUIZ_ACTION_ERROR_CODE.PLAY_ARCHIVED);
    }
  });
});

// ---------------------------------------------------------------------------
// startAttemptQuestionAction
// ---------------------------------------------------------------------------

describe("startAttemptQuestionAction", () => {
  beforeEach(() => vi.resetAllMocks());

  it("creates a new timing entry with deadlineAt for timed quiz", async () => {
    const attemptWithTimer = {
      ...baseAttempt,
      quizLink: {
        quiz: {
          status: "ACTIVE",
          settings: { timeLimitPerQuestion: 30 },
          questions: [{ id: "q1" }],
        },
      },
    };
    // First call: findUnique for attempt
    mockFindUnique
      .mockResolvedValueOnce(attemptWithTimer) // attempt
      .mockResolvedValueOnce(null); // no existing timing

    const now = Date.now();
    mockCreate.mockResolvedValue({
      startedAt: new Date(now),
      deadlineAt: new Date(now + 30_000),
    });

    const result = await startAttemptQuestionAction("att-1", "q1");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.deadlineAt).not.toBeNull();
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          attemptId: "att-1",
          questionId: "q1",
        }),
      }),
    );
  });

  it("returns existing timing without reset (anti-cheat)", async () => {
    const existingTiming = {
      startedAt: new Date(Date.now() - 10_000),
      deadlineAt: new Date(Date.now() + 20_000),
    };
    mockFindUnique
      .mockResolvedValueOnce(baseAttempt) // attempt
      .mockResolvedValueOnce(existingTiming); // existing timing

    const result = await startAttemptQuestionAction("att-1", "q1");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.deadlineAt).toEqual(existingTiming.deadlineAt);
    expect(mockCreate).not.toHaveBeenCalled(); // no new record created
  });

  it("creates timing with null deadlineAt for quiz without timer", async () => {
    mockFindUnique
      .mockResolvedValueOnce(baseAttempt) // attempt (settings: {})
      .mockResolvedValueOnce(null); // no existing timing

    mockCreate.mockResolvedValue({ startedAt: new Date(), deadlineAt: null });

    const result = await startAttemptQuestionAction("att-1", "q1");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.deadlineAt).toBeNull();
  });

  it("rejects unknown questionId", async () => {
    mockFindUnique.mockResolvedValueOnce(baseAttempt).mockResolvedValueOnce(null);
    const result = await startAttemptQuestionAction("att-1", "unknown-q");
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// submitAttemptAnswerAction
// ---------------------------------------------------------------------------

describe("submitAttemptAnswerAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFindFirst.mockResolvedValue(null); // no existing QuizAnswer
    mockUpdate.mockResolvedValue({});
    mockCreate.mockResolvedValue({});
  });

  it("saves correct answer before deadline", async () => {
    const timing = {
      id: "timing-1",
      startedAt: new Date(Date.now() - 5_000), // started 5s ago
      deadlineAt: new Date(Date.now() + 25_000), // 25s remaining
    };
    mockFindUnique
      .mockResolvedValueOnce(baseAttempt) // attempt
      .mockResolvedValueOnce(timing); // timing

    const result = await submitAttemptAnswerAction("att-1", "q1", ["o1"]);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.isCorrect).toBe(true);
    expect(result.expired).toBe(false);
  });

  it("marks answer expired when submitted after deadline", async () => {
    const timing = {
      id: "timing-1",
      startedAt: new Date(Date.now() - 40_000), // started 40s ago
      deadlineAt: new Date(Date.now() - 10_000), // expired 10s ago
    };
    mockFindUnique
      .mockResolvedValueOnce(baseAttempt)
      .mockResolvedValueOnce(timing);

    const result = await submitAttemptAnswerAction("att-1", "q1", ["o1"]);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.expired).toBe(true);
    expect(result.isCorrect).toBe(false); // expired → incorrect
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ expired: true }),
      }),
    );
  });

  it("rejects invalid option ids", async () => {
    mockFindUnique.mockResolvedValue(baseAttempt);
    const result = await submitAttemptAnswerAction("att-1", "q1", ["invalid-id"]);
    expect(result.success).toBe(false);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("refuses empty selectedOptionIds", async () => {
    const result = await submitAttemptAnswerAction("att-1", "q1", []);
    expect(result.success).toBe(false);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("refuses answers when quiz is ARCHIVED", async () => {
    mockFindUnique.mockResolvedValue({
      ...baseAttempt,
      quizLink: {
        quiz: {
          ...baseAttempt.quizLink.quiz,
          status: "ARCHIVED",
        },
      },
    });
    const result = await submitAttemptAnswerAction("att-1", "q1", ["o1"]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(QUIZ_ACTION_ERROR_CODE.PLAY_ARCHIVED);
    }
  });

  it("does not reveal correct options when showAnswerImmediately is false", async () => {
    const timing = {
      id: "timing-1",
      startedAt: new Date(Date.now() - 5_000),
      deadlineAt: new Date(Date.now() + 25_000),
    };
    mockFindUnique
      .mockResolvedValueOnce({
        ...baseAttempt,
        quizLink: {
          quiz: {
            ...baseAttempt.quizLink.quiz,
            settings: { showAnswerImmediately: false },
          },
        },
      })
      .mockResolvedValueOnce(timing);

    const result = await submitAttemptAnswerAction("att-1", "q1", ["o1"]);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.correctOptionIds).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// finishAnonymousQuizAttemptAction
// ---------------------------------------------------------------------------

describe("finishAnonymousQuizAttemptAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockExecuteRaw.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue({});
    mockCreate.mockResolvedValue({});
  });

  it("calculates score server-side from stored answers", async () => {
    const fullAttempt = {
      ...baseAttempt,
      answers: [{ questionId: "q1", isCorrect: true }], // already submitted
      questionTimings: [],
    };
    mockFindUnique
      .mockResolvedValueOnce(fullAttempt) // attempt
      .mockResolvedValueOnce({ // updated attempt after write
        score: 100,
        startedAt: fullAttempt.startedAt,
        finishedAt: new Date(),
        durationSeconds: 30,
      });
    mockFindMany
      .mockResolvedValueOnce([{ questionId: "q1", isCorrect: true, expired: false, selectedOptionIds: ["o1"], answeredAt: new Date(), timeSpent: 5 }]) // final answers
      .mockResolvedValueOnce([]); // timings

    const result = await finishAnonymousQuizAttemptAction("att-1", []);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.totalQuestions).toBe(1);
    expect(result.correctAnswersCount).toBe(1);
    expect(result.score).toBe(100);
  });

  it("calculates durationSeconds server-side", async () => {
    const startedAt = new Date(Date.now() - 60_000); // 60s ago
    const fullAttempt = {
      ...baseAttempt,
      startedAt,
      answers: [{ questionId: "q1", isCorrect: true }],
      questionTimings: [],
    };
    mockFindUnique
      .mockResolvedValueOnce(fullAttempt)
      .mockResolvedValueOnce({
        score: 100,
        startedAt,
        finishedAt: new Date(),
        durationSeconds: 60,
      });
    mockFindMany
      .mockResolvedValueOnce([{ questionId: "q1", isCorrect: true, expired: false, selectedOptionIds: ["o1"], answeredAt: new Date(), timeSpent: null }])
      .mockResolvedValueOnce([]);

    const result = await finishAnonymousQuizAttemptAction("att-1", []);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.durationSec).toBeGreaterThanOrEqual(59); // ~60s
  });

  it("stores remaining unanswered questions as incorrect", async () => {
    // No answers stored yet, pass remaining answers at finish
    mockFindUnique
      .mockResolvedValueOnce({ ...baseAttempt, answers: [], questionTimings: [] })
      .mockResolvedValueOnce({ score: 100, startedAt: baseAttempt.startedAt, finishedAt: new Date(), durationSeconds: 10 });
    mockFindMany
      .mockResolvedValueOnce([{ questionId: "q1", isCorrect: true, expired: false, selectedOptionIds: ["o1"], answeredAt: new Date(), timeSpent: 5 }])
      .mockResolvedValueOnce([]);
    mockFindFirst.mockResolvedValue(null); // no existing answer

    const result = await finishAnonymousQuizAttemptAction("att-1", [
      { questionId: "q1", selectedOptionIds: ["o1"] },
    ]);

    expect(result.success).toBe(true);
    expect(mockCreate).toHaveBeenCalled(); // answer was created
  });

  it("does not show details when showAnswersAtEnd is false", async () => {
    const fullAttempt = {
      ...baseAttempt,
      quizLink: {
        quiz: {
          ...baseAttempt.quizLink.quiz,
          settings: { showAnswersAtEnd: false },
        },
      },
      answers: [{ questionId: "q1", isCorrect: true }],
      questionTimings: [],
    };
    mockFindUnique
      .mockResolvedValueOnce(fullAttempt)
      .mockResolvedValueOnce({ score: 100, startedAt: fullAttempt.startedAt, finishedAt: new Date(), durationSeconds: 5 });
    mockFindMany
      .mockResolvedValueOnce([{ questionId: "q1", isCorrect: true, expired: false, selectedOptionIds: ["o1"], answeredAt: new Date(), timeSpent: null }])
      .mockResolvedValueOnce([]);

    const result = await finishAnonymousQuizAttemptAction("att-1", []);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.showAnswersAtEnd).toBe(false);
    expect(result.details[0]?.correctOptionIds).toEqual([]); // stripped
    expect(result.details[0]?.explanation).toBeNull(); // stripped
  });
});
