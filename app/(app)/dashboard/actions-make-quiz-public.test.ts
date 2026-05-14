import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockQuizFindUnique = vi.fn();
const mockQuizUpdate = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quiz: {
      findUnique: (...args: unknown[]) => mockQuizFindUnique(...args),
      update: (...args: unknown[]) => mockQuizUpdate(...args),
    },
  },
}));

vi.mock("@/lib/coins", () => ({
  deductCoins: vi.fn(),
}));

import { makeQuizPublicWithCoins } from "./actions";
import { QUIZ_ACTION_ERROR_CODE } from "@/lib/quiz/quizActionErrorCodes";

describe("makeQuizPublicWithCoins", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "USER" } });
  });

  it("refuses when quiz is DRAFT", async () => {
    mockQuizFindUnique.mockResolvedValue({
      ownerId: "user-1",
      visibility: "PRIVATE",
      status: "DRAFT",
    });

    const result = await makeQuizPublicWithCoins("quiz-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(QUIZ_ACTION_ERROR_CODE.MAKE_PUBLIC_REQUIRES_ACTIVE);
    }
    expect(mockQuizUpdate).not.toHaveBeenCalled();
  });
});
