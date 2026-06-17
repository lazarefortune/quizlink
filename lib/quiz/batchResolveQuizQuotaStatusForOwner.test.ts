import { beforeEach, describe, expect, it, vi } from "vitest";

const mockQuizUnlockFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quizUnlock: {
      findMany: (...args: unknown[]) => mockQuizUnlockFindMany(...args),
    },
    quizResponseStats: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    quizAttempt: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock("./getActiveUserSubscriptionAccess", () => ({
  getActiveUserSubscriptionAccess: vi.fn(),
}));

vi.mock("./batchResolveQuizCompletedCounts", () => ({
  batchResolveQuizCompletedCounts: vi.fn(),
}));

import { batchResolveQuizCompletedCounts } from "./batchResolveQuizCompletedCounts";
import { batchResolveQuizQuotaStatusForOwner } from "./batchResolveQuizQuotaStatusForOwner";
import {
  getActiveUserSubscriptionAccess,
  type ActiveUserSubscriptionAccess,
} from "./getActiveUserSubscriptionAccess";

const now = new Date("2026-05-26T10:00:00.000Z");

const inactiveSubscription: ActiveUserSubscriptionAccess = {
  isActive: false,
  plan: null,
  status: null,
  currentPeriodEnd: null,
  subscriptionId: null,
  expiresAt: null,
};

const activeSubscription: ActiveUserSubscriptionAccess = {
  isActive: true,
  plan: "PRO",
  status: "ACTIVE",
  currentPeriodEnd: new Date("2026-12-31T00:00:00.000Z"),
  subscriptionId: "sub-1",
  expiresAt: new Date("2026-12-31T00:00:00.000Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getActiveUserSubscriptionAccess).mockResolvedValue(inactiveSubscription);
  mockQuizUnlockFindMany.mockResolvedValue([]);
});

describe("batchResolveQuizQuotaStatusForOwner", () => {
  it("returns FREE_AVAILABLE at 12/20", async () => {
    vi.mocked(batchResolveQuizCompletedCounts).mockResolvedValue(
      new Map([["quiz-1", 12]]),
    );

    const result = await batchResolveQuizQuotaStatusForOwner("owner-1", ["quiz-1"], now);

    expect(result.get("quiz-1")?.label).toBe("FREE_AVAILABLE");
    expect(result.get("quiz-1")?.completedResponses).toBe(12);
    expect(result.get("quiz-1")?.canAcceptResponses).toBe(true);
  });

  it("returns FREE_LIMIT_REACHED at 20/20", async () => {
    vi.mocked(batchResolveQuizCompletedCounts).mockResolvedValue(
      new Map([["quiz-1", 20]]),
    );

    const result = await batchResolveQuizQuotaStatusForOwner("owner-1", ["quiz-1"], now);

    expect(result.get("quiz-1")?.label).toBe("FREE_LIMIT_REACHED");
    expect(result.get("quiz-1")?.canAcceptResponses).toBe(false);
  });

  it("returns UNLOCKED when a permanent QuizUnlock exists", async () => {
    vi.mocked(batchResolveQuizCompletedCounts).mockResolvedValue(
      new Map([["quiz-1", 25]]),
    );
    mockQuizUnlockFindMany.mockResolvedValue([
      { quizId: "quiz-1", type: "SINGLE_QUIZ" },
    ]);

    const result = await batchResolveQuizQuotaStatusForOwner("owner-1", ["quiz-1"], now);

    expect(result.get("quiz-1")?.label).toBe("UNLOCKED");
    expect(result.get("quiz-1")?.unlockedBy).toBe("COINS");
    expect(result.get("quiz-1")?.canAcceptResponses).toBe(true);
  });

  it("returns PRO_ACTIVE when owner subscription is active", async () => {
    vi.mocked(getActiveUserSubscriptionAccess).mockResolvedValue(activeSubscription);
    vi.mocked(batchResolveQuizCompletedCounts).mockResolvedValue(
      new Map([["quiz-1", 30]]),
    );

    const result = await batchResolveQuizQuotaStatusForOwner("owner-1", ["quiz-1"], now);

    expect(result.get("quiz-1")?.label).toBe("PRO_ACTIVE");
    expect(result.get("quiz-1")?.unlockedBy).toBe("SUBSCRIPTION");
    expect(mockQuizUnlockFindMany).not.toHaveBeenCalled();
  });

  it("loads unlock metadata without legacy quiz link expiration columns", async () => {
    vi.mocked(batchResolveQuizCompletedCounts).mockResolvedValue(
      new Map([["quiz-1", 12]]),
    );

    await batchResolveQuizQuotaStatusForOwner("owner-1", ["quiz-1"], now);

    expect(mockQuizUnlockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "owner-1",
          quizId: { in: ["quiz-1"] },
        }),
      }),
    );
    expect(mockQuizUnlockFindMany.mock.calls[0]?.[0]?.select).toEqual({
      quizId: true,
      type: true,
    });
  });
});
