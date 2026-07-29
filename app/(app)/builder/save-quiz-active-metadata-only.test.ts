import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockAuth = vi.fn();
const mockQuizFindUnique = vi.fn();
const mockQuizAnswerCount = vi.fn();
const mockQuizUpdate = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quiz: {
      findUnique: (...args: unknown[]) => mockQuizFindUnique(...args),
      update: (...args: unknown[]) => mockQuizUpdate(...args),
    },
    quizAnswer: {
      count: (...args: unknown[]) => mockQuizAnswerCount(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

import { saveQuiz } from "./actions";
import type { QuizBuilder } from "@/types/quiz-builder";

const persistedRow = {
  id: "quiz-1",
  ownerId: "user-1",
  status: "ACTIVE",
  questions: [
    {
      id: "pq1",
      type: "MULTIPLE_CHOICE",
      label: "Q?",
      image: null as string | null,
      imageKey: null as string | null,
      explanation: null as string | null,
      options: [
        { id: "po1", label: "A", isCorrect: true },
        { id: "po2", label: "B", isCorrect: false },
      ],
    },
  ],
};

const matchingBuilder: QuizBuilder = {
  id: "quiz-1",
  name: "New title",
  visibility: "PUBLIC",
  settings: {
    showAnswerImmediately: true,
    randomizeQuestions: true,
    randomizeOptions: false,
    timeLimitPerQuestion: 30,
  },
  questions: [
    {
      id: "client-q",
      type: "MULTIPLE_CHOICE",
      label: "Q?",
      options: [
        { id: "co1", label: "A", isCorrect: true },
        { id: "co2", label: "B", isCorrect: false },
      ],
    },
  ],
  createdBy: "USER",
  createdAt: "2025-01-01T00:00:00.000Z",
};

describe("saveQuiz — ACTIVE quiz with recorded answers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockQuizAnswerCount.mockResolvedValue(2);
    mockQuizUpdate.mockResolvedValue({});
    mockQuizFindUnique.mockImplementation((args: { include?: unknown }) => {
      if (args.include) {
        return persistedRow;
      }
      return { ownerId: "user-1", status: "ACTIVE" };
    });
  });

  it("updates only metadata when playable content matches persisted questions", async () => {
    const result = await saveQuiz(matchingBuilder, "quiz-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.savedMetadata).toBe(true);
      expect(result.savedQuestions).toBe(false);
    }
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockQuizUpdate).toHaveBeenCalledTimes(1);
    const updateArg = mockQuizUpdate.mock.calls[0][0];
    expect(updateArg.where).toEqual({ id: "quiz-1" });
    expect(updateArg.data).toEqual({
      name: "New title",
      visibility: "PUBLIC",
      settings: matchingBuilder.settings,
    });
    expect(updateArg.data.questions).toBeUndefined();
  });

  it("rejects content changes when answers exist and playable content differs", async () => {
    const changed: QuizBuilder = {
      ...matchingBuilder,
      questions: [
        {
          ...matchingBuilder.questions[0]!,
          label: "Different",
        },
      ],
    };

    const result = await saveQuiz(changed, "quiz-1");

    expect(result.success).toBe(false);
    expect(mockQuizUpdate).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
