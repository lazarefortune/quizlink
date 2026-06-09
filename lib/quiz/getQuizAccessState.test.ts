import { beforeEach, describe, expect, it, vi } from "vitest";

const mockQuizUnlockFindFirst = vi.fn();
const mockGetSubscription = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quizUnlock: {
      findFirst: (...args: unknown[]) => mockQuizUnlockFindFirst(...args),
    },
  },
}));

vi.mock("./getActiveUserSubscriptionAccess", () => ({
  getActiveUserSubscriptionAccess: (...args: unknown[]) => mockGetSubscription(...args),
}));

import { getQuizAccessState } from "./getQuizAccessState";

const quizId = "quiz-1";
const userId = "user-1";
const future = new Date("2027-01-01T00:00:00Z");
const past = new Date("2020-01-01T00:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSubscription.mockResolvedValue({ isActive: false, expiresAt: null });
});

describe("getQuizAccessState", () => {
  it("returns unlocked when subscription is active", async () => {
    mockGetSubscription.mockResolvedValue({
      isActive: true,
      expiresAt: future,
    });

    const state = await getQuizAccessState({ quizId, userId });
    expect(state.isUnlocked).toBe(true);
    expect(state.unlockedBy).toBe("SUBSCRIPTION");
    expect(state.expiresAt).toEqual(future);
    expect(mockQuizUnlockFindFirst).not.toHaveBeenCalled();
  });

  it("returns unlocked when active QuizUnlock exists", async () => {
    mockQuizUnlockFindFirst.mockResolvedValue({
      id: "unlock-1",
      type: "SINGLE_QUIZ",
      expiresAt: future,
    });

    const state = await getQuizAccessState({ quizId, userId, now: new Date("2026-06-01") });
    expect(state.isUnlocked).toBe(true);
    expect(state.unlockedBy).toBe("QUIZ_UNLOCK");
    expect(state.activeQuizUnlockId).toBe("unlock-1");
    expect(state.expiresAt).toEqual(future);
  });

  it("returns locked when unlock is expired", async () => {
    mockQuizUnlockFindFirst.mockResolvedValue(null);

    const state = await getQuizAccessState({
      quizId,
      userId,
      now: past,
    });
    expect(state.isUnlocked).toBe(false);
    expect(state.unlockedBy).toBeNull();
  });
});
