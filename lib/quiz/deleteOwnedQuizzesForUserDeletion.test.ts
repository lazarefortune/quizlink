import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuizFindMany = vi.fn();
const mockQuizAnswerDeleteMany = vi.fn();
const mockQuizAttemptQuestionDeleteMany = vi.fn();
const mockQuizDeleteMany = vi.fn();

const tx = {
  quiz: {
    findMany: (...args: unknown[]) => mockQuizFindMany(...args),
    deleteMany: (...args: unknown[]) => mockQuizDeleteMany(...args),
  },
  quizAnswer: {
    deleteMany: (...args: unknown[]) => mockQuizAnswerDeleteMany(...args),
  },
  quizAttemptQuestion: {
    deleteMany: (...args: unknown[]) => mockQuizAttemptQuestionDeleteMany(...args),
  },
};

import { deleteOwnedQuizzesForUserDeletion } from "./deleteOwnedQuizzesForUserDeletion";

describe("deleteOwnedQuizzesForUserDeletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuizFindMany.mockResolvedValue([]);
    mockQuizAnswerDeleteMany.mockResolvedValue({ count: 0 });
    mockQuizAttemptQuestionDeleteMany.mockResolvedValue({ count: 0 });
    mockQuizDeleteMany.mockResolvedValue({ count: 0 });
  });

  it("does nothing when the user owns no quizzes", async () => {
    await deleteOwnedQuizzesForUserDeletion(tx as never, "user-1");

    expect(mockQuizFindMany).toHaveBeenCalledWith({
      where: { ownerId: "user-1" },
      select: { id: true },
    });
    expect(mockQuizAnswerDeleteMany).not.toHaveBeenCalled();
    expect(mockQuizAttemptQuestionDeleteMany).not.toHaveBeenCalled();
    expect(mockQuizDeleteMany).not.toHaveBeenCalled();
  });

  it("deletes restrict-linked attempt data before owned quizzes", async () => {
    mockQuizFindMany.mockResolvedValue([{ id: "quiz-1" }, { id: "quiz-2" }]);

    await deleteOwnedQuizzesForUserDeletion(tx as never, "user-1");

    expect(mockQuizAnswerDeleteMany).toHaveBeenCalledWith({
      where: { attempt: { quizLink: { quizId: { in: ["quiz-1", "quiz-2"] } } } },
    });
    expect(mockQuizAttemptQuestionDeleteMany).toHaveBeenCalledWith({
      where: { attempt: { quizLink: { quizId: { in: ["quiz-1", "quiz-2"] } } } },
    });
    expect(mockQuizDeleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["quiz-1", "quiz-2"] } },
    });
  });
});
