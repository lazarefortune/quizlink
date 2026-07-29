import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockAuth = vi.fn();
const mockQuizFindUnique = vi.fn();
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

const persistedDraftQuiz = {
  ownerId: "user-1",
  status: "DRAFT",
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

const validQuiz: QuizBuilder = {
  id: "quiz-1",
  name: "Mon quiz",
  visibility: "PRIVATE",
  settings: persistedDraftQuiz.settings,
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

describe("saveQuiz — split metadata/questions save", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockQuizUpdate.mockResolvedValue({});
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
  });

  it("saves metadata only when questions are invalid", async () => {
    const quizWithInvalidQuestion: QuizBuilder = {
      ...validQuiz,
      name: "Nouveau titre",
      questions: [
        {
          ...validQuiz.questions[0]!,
          label: "",
        },
      ],
    };

    const result = await saveQuiz(quizWithInvalidQuestion, "quiz-1");

    expect(result).toEqual({
      success: true,
      quizId: "quiz-1",
      savedMetadata: true,
      savedQuestions: false,
    });
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockQuizUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "quiz-1" },
        data: expect.objectContaining({
          name: "Nouveau titre",
        }),
      }),
    );
    expect(mockQuizUpdate.mock.calls[0]?.[0]?.data?.questions).toBeUndefined();
  });

  it("saves metadata only when only metadata changed", async () => {
    const renamedQuiz: QuizBuilder = {
      ...validQuiz,
      name: "Titre mis à jour",
    };

    const result = await saveQuiz(renamedQuiz, "quiz-1");

    expect(result).toEqual({
      success: true,
      quizId: "quiz-1",
      savedMetadata: true,
      savedQuestions: false,
    });
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockQuizUpdate).toHaveBeenCalledTimes(1);
  });
});
