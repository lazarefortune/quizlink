import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockAuth = vi.fn();
const mockQuizFindUnique = vi.fn();
const mockQuizCreate = vi.fn();
const mockQuizUpdate = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quiz: {
      findUnique: (...args: unknown[]) => mockQuizFindUnique(...args),
      create: (...args: unknown[]) => mockQuizCreate(...args),
      update: (...args: unknown[]) => mockQuizUpdate(...args),
    },
    quizAnswer: {
      count: vi.fn().mockResolvedValue(0),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock("./user-quiz-visibility", () => ({
  getUserQuizCreationVisibility: () => "PRIVATE",
}));

import { saveQuiz } from "./actions";
import type { QuizBuilder } from "@/types/quiz-builder";

const validQuiz: QuizBuilder = {
  id: "quiz-1",
  name: "Mon quiz",
  visibility: "PRIVATE",
  settings: {
    showAnswerImmediately: true,
    randomizeQuestions: false,
    randomizeOptions: false,
    timeLimitPerQuestion: null,
  },
  questions: [
    {
      id: "q1",
      type: "MULTIPLE_CHOICE",
      label: "Question?",
      options: [
        { id: "o1", label: "A", isCorrect: true },
        { id: "o2", label: "B", isCorrect: false },
      ],
    },
  ],
  createdBy: "USER",
  createdAt: "2025-01-01T00:00:00.000Z",
};

describe("saveQuiz — quiz name validation", () => {
  const persistedDraftQuiz = {
    ownerId: "user-1",
    status: "DRAFT",
    name: "Mon quiz",
    visibility: "PRIVATE",
    settings: validQuiz.settings,
    questions: [
      {
        id: "q1",
        type: "MULTIPLE_CHOICE",
        label: "Question?",
        image: null,
        imageKey: null,
        explanation: null,
        options: [
          { id: "o1", label: "A", isCorrect: true },
          { id: "o2", label: "B", isCorrect: false },
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockQuizFindUnique.mockImplementation((args: { include?: unknown; select?: unknown }) => {
      if (args?.select) {
        return { ownerId: "user-1", status: "DRAFT" };
      }
      if (args?.include) {
        return persistedDraftQuiz;
      }
      return { ownerId: "user-1", status: "DRAFT" };
    });
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        quizAnswer: { count: vi.fn().mockResolvedValue(0) },
        option: { deleteMany: vi.fn() },
        question: { deleteMany: vi.fn() },
        quiz: { update: mockQuizUpdate },
        quizLink: { findMany: vi.fn().mockResolvedValue([]) },
        quizAttempt: { findMany: vi.fn().mockResolvedValue([]) },
        quizLinkAnonymousStats: { deleteMany: vi.fn() },
      };
      await fn(tx);
    });
    mockQuizUpdate.mockResolvedValue({});
  });

  it("refuses an empty quiz name", async () => {
    const result = await saveQuiz({ ...validQuiz, name: "" }, "quiz-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Quiz validation failed");
    }
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockQuizUpdate).not.toHaveBeenCalled();
  });

  it("refuses a whitespace-only quiz name", async () => {
    const result = await saveQuiz({ ...validQuiz, name: "   " }, "quiz-1");

    expect(result.success).toBe(false);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("refuses legacy sentinel titles", async () => {
    const frResult = await saveQuiz({ ...validQuiz, name: "Quiz sans titre" }, "quiz-1");
    const enResult = await saveQuiz({ ...validQuiz, name: "Untitled quiz" }, "quiz-1");

    expect(frResult.success).toBe(false);
    expect(enResult.success).toBe(false);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("trims the quiz name before persisting when the normalized name changes", async () => {
    mockQuizFindUnique.mockImplementation((args: { include?: unknown; select?: unknown }) => {
      if (args?.select) {
        return { ownerId: "user-1", status: "DRAFT" };
      }
      if (args?.include) {
        return {
          ...persistedDraftQuiz,
          name: "Ancien titre",
        };
      }
      return { ownerId: "user-1", status: "DRAFT" };
    });

    const result = await saveQuiz({ ...validQuiz, name: "  Mon quiz  " }, "quiz-1");

    expect(result).toEqual({
      success: true,
      quizId: "quiz-1",
      savedMetadata: true,
      savedQuestions: false,
    });
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockQuizUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Mon quiz" }),
      }),
    );
  });
});
