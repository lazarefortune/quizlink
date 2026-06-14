import { beforeEach, describe, expect, it, vi } from "vitest";

const mockQuizResponseStatsFindMany = vi.fn();
const mockQuizAttemptFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quizResponseStats: {
      findMany: (...args: unknown[]) => mockQuizResponseStatsFindMany(...args),
    },
    quizAttempt: {
      findMany: (...args: unknown[]) => mockQuizAttemptFindMany(...args),
    },
  },
}));

import { batchResolveQuizCompletedCounts } from "./batchResolveQuizCompletedCounts";

beforeEach(() => {
  vi.clearAllMocks();
  mockQuizResponseStatsFindMany.mockResolvedValue([]);
  mockQuizAttemptFindMany.mockResolvedValue([]);
});

describe("batchResolveQuizCompletedCounts", () => {
  it("prefers aggregate totalCompleted when available", async () => {
    mockQuizResponseStatsFindMany.mockResolvedValue([
      { quizId: "quiz-1", totalCompleted: 8 },
    ]);

    const counts = await batchResolveQuizCompletedCounts(["quiz-1"]);

    expect(counts.get("quiz-1")).toBe(8);
    expect(mockQuizAttemptFindMany).toHaveBeenCalled();
  });

  it("falls back to counting completed creator-visible attempts", async () => {
    mockQuizAttemptFindMany.mockResolvedValue([
      { quizLink: { quizId: "quiz-2" } },
      { quizLink: { quizId: "quiz-2" } },
      { quizLink: { quizId: "quiz-2" } },
    ]);

    const counts = await batchResolveQuizCompletedCounts(["quiz-2"]);

    expect(counts.get("quiz-2")).toBe(3);
  });

  it("returns zero for quizzes with no data", async () => {
    const counts = await batchResolveQuizCompletedCounts(["quiz-empty"]);

    expect(counts.get("quiz-empty")).toBe(0);
  });
});
