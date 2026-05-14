import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();
const mockFindFirst = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quizAttempt: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    quizAnswer: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

import { submitAnswerForAttempt } from "./play-actions";
import { QUIZ_ACTION_ERROR_CODE } from "@/lib/quiz/quizActionErrorCodes";

const baseAttempt = {
  id: "att-1",
  status: "IN_PROGRESS",
  startedAt: new Date(),
  quizLink: {
    quiz: {
      status: "ACTIVE",
      settings: {},
      questions: [
        {
          id: "q1",
          options: [
            { id: "o1", isCorrect: true },
            { id: "o2", isCorrect: false },
          ],
        },
      ],
    },
  },
};

describe("submitAnswerForAttempt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindFirst.mockResolvedValue(null);
  });

  it("refuses new answers when quiz is ARCHIVED", async () => {
    mockFindUnique.mockResolvedValue({
      ...baseAttempt,
      quizLink: {
        quiz: {
          ...baseAttempt.quizLink.quiz,
          status: "ARCHIVED",
        },
      },
    });

    const result = await submitAnswerForAttempt("att-1", "q1", ["o1"]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(QUIZ_ACTION_ERROR_CODE.PLAY_ARCHIVED);
    }
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
