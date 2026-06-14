import { beforeEach, describe, expect, it, vi } from "vitest";

const mockQuizFindUnique = vi.fn();
const mockTransaction = vi.fn();
const mockGetQuizAccessState = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quiz: { findUnique: (...args: unknown[]) => mockQuizFindUnique(...args) },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("./getQuizAccessState", () => ({
  getQuizAccessState: (...args: unknown[]) => mockGetQuizAccessState(...args),
}));

import { QUIZ_UNLOCK_COIN_COST, UNLOCK_QUIZ_ERROR } from "./quizUnlockConstants";
import { unlockQuizWithCoins } from "./unlockQuizWithCoins";

const quizId = "quiz-1";
const userId = "user-1";

beforeEach(() => {
  vi.clearAllMocks();
  mockQuizFindUnique.mockResolvedValue({ id: quizId, ownerId: userId });
  mockGetQuizAccessState.mockResolvedValue({
    isUnlocked: false,
    unlockedBy: null,
    expiresAt: null,
    activeQuizUnlockId: null,
  });
});

describe("unlockQuizWithCoins", () => {
  it("rejects non-owner", async () => {
    mockQuizFindUnique.mockResolvedValue({ id: quizId, ownerId: "other" });
    const result = await unlockQuizWithCoins(quizId, userId);
    expect(result).toEqual({ success: false, error: UNLOCK_QUIZ_ERROR.UNAUTHORIZED });
  });

  it("returns success without debit when already unlocked", async () => {
    mockGetQuizAccessState.mockResolvedValue({
      isUnlocked: true,
      unlockedBy: "QUIZ_UNLOCK",
      expiresAt: null,
      activeQuizUnlockId: "u1",
    });
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      coinBalance: 50,
    } as Awaited<ReturnType<NonNullable<typeof prisma>["user"]["findUnique"]>>);

    const result = await unlockQuizWithCoins(quizId, userId);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.alreadyUnlocked).toBe(true);
    expect(result.expiresAt).toBeNull();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("debits coins and creates permanent unlock in transaction", async () => {
    const txMocks = {
      $queryRaw: vi.fn().mockResolvedValue([{ coinBalance: 50 }]),
      user: { update: vi.fn(), findUnique: vi.fn().mockResolvedValue({ coinBalance: 10 }) },
      coinTransaction: { create: vi.fn() },
      quizUnlock: { create: vi.fn() },
      quizLink: { updateMany: vi.fn() },
    };

    mockGetQuizAccessState
      .mockResolvedValueOnce({
        isUnlocked: false,
        unlockedBy: null,
        expiresAt: null,
        activeQuizUnlockId: null,
      })
      .mockResolvedValueOnce({
        isUnlocked: false,
        unlockedBy: null,
        expiresAt: null,
        activeQuizUnlockId: null,
      });

    mockTransaction.mockImplementation(async (fn: (tx: typeof txMocks) => Promise<unknown>) => {
      return fn(txMocks);
    });

    const result = await unlockQuizWithCoins(quizId, userId);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.alreadyUnlocked).toBe(false);
    expect(result.newBalance).toBe(50 - QUIZ_UNLOCK_COIN_COST);
    expect(result.expiresAt).toBeNull();

    expect(txMocks.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { coinBalance: 50 - QUIZ_UNLOCK_COIN_COST },
    });
    expect(txMocks.quizUnlock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          quizId,
          userId,
          coinsSpent: QUIZ_UNLOCK_COIN_COST,
          expiresAt: null,
        }),
      }),
    );
    expect(txMocks.quizLink.updateMany).not.toHaveBeenCalled();
  });

  it("returns insufficient coins when balance too low", async () => {
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        $queryRaw: vi.fn().mockResolvedValue([{ coinBalance: 5 }]),
      };
      return fn(tx);
    });

    const result = await unlockQuizWithCoins(quizId, userId);
    expect(result).toEqual({ success: false, error: UNLOCK_QUIZ_ERROR.INSUFFICIENT_COINS });
  });
});
