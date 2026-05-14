import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockQuizFindUnique = vi.fn();
const mockQuizAnswerCount = vi.fn();
const mockAnonymousFindMany = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quiz: {
      findUnique: (...args: unknown[]) => mockQuizFindUnique(...args),
    },
    quizAnswer: {
      count: (...args: unknown[]) => mockQuizAnswerCount(...args),
    },
    quizLinkAnonymousStats: {
      findMany: (...args: unknown[]) => mockAnonymousFindMany(...args),
    },
  },
}));

import { getActiveQuizSaveStatsWarning } from "./actions";

describe("getActiveQuizSaveStatsWarning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "owner-1" } });
  });

  it("returns needsWarning false when quiz is not ACTIVE", async () => {
    mockQuizFindUnique.mockResolvedValue({ ownerId: "owner-1", status: "DRAFT" });

    const result = await getActiveQuizSaveStatsWarning("quiz-1");

    expect(result).toEqual({ success: true, needsWarning: false });
    expect(mockQuizAnswerCount).not.toHaveBeenCalled();
  });

  it("returns needsWarning true when quiz has stored answers", async () => {
    mockQuizFindUnique.mockResolvedValue({ ownerId: "owner-1", status: "ACTIVE" });
    mockQuizAnswerCount.mockResolvedValue(2);
    mockAnonymousFindMany.mockResolvedValue([]);

    const result = await getActiveQuizSaveStatsWarning("quiz-1");

    expect(result).toEqual({ success: true, needsWarning: true });
  });

  it("returns needsWarning true when anonymous stats show engagement", async () => {
    mockQuizFindUnique.mockResolvedValue({ ownerId: "owner-1", status: "ACTIVE" });
    mockQuizAnswerCount.mockResolvedValue(0);
    mockAnonymousFindMany.mockResolvedValue([{ startedCount: 1, completedCount: 0 }]);

    const result = await getActiveQuizSaveStatsWarning("quiz-1");

    expect(result).toEqual({ success: true, needsWarning: true });
  });
});
