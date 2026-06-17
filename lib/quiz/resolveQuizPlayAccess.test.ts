import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetQuizCompletedResponseCount = vi.fn();
const mockGetQuizAccessState = vi.fn();

vi.mock("./getQuizCompletedResponseCount", () => ({
  getQuizCompletedResponseCount: (...args: unknown[]) =>
    mockGetQuizCompletedResponseCount(...args),
}));

vi.mock("./getQuizAccessState", () => ({
  getQuizAccessState: (...args: unknown[]) => mockGetQuizAccessState(...args),
}));

import {
  getQuizPlayBlockErrorCode,
  resolveQuizPlayAccess,
} from "./resolveQuizPlayAccess";
import { QUIZ_ACTION_ERROR_CODE } from "./quizActionErrorCodes";

const quizId = "quiz-1";
const ownerId = "owner-1";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetQuizAccessState.mockResolvedValue({
    isUnlocked: false,
    unlockedBy: null,
    expiresAt: null,
    activeQuizUnlockId: null,
  });
});

describe("resolveQuizPlayAccess", () => {
  it("allows start at 19 completed responses on free plan", async () => {
    mockGetQuizCompletedResponseCount.mockResolvedValue(19);

    const access = await resolveQuizPlayAccess({ quizId, ownerId });

    expect(access.completedResponses).toBe(19);
    expect(access.remainingFreeResponses).toBe(1);
    expect(access.canAcceptResponses).toBe(true);
    expect(access.isProActive).toBe(false);
    expect(access.isQuizUnlockedWithCoins).toBe(false);
  });

  it("blocks start at 20 completed responses on free plan", async () => {
    mockGetQuizCompletedResponseCount.mockResolvedValue(20);

    const access = await resolveQuizPlayAccess({ quizId, ownerId });

    expect(access.hasReachedFreeLimit).toBe(true);
    expect(access.canAcceptResponses).toBe(false);
  });

  it("allows start at 20 completed when coin-unlocked", async () => {
    mockGetQuizCompletedResponseCount.mockResolvedValue(20);
    mockGetQuizAccessState.mockResolvedValue({
      isUnlocked: true,
      unlockedBy: "QUIZ_UNLOCK",
      expiresAt: null,
      activeQuizUnlockId: "unlock-1",
    });

    const access = await resolveQuizPlayAccess({ quizId, ownerId });

    expect(access.isQuizUnlockedWithCoins).toBe(true);
    expect(access.canAcceptResponses).toBe(true);
  });

  it("allows start at 20 completed when Pro is active", async () => {
    mockGetQuizCompletedResponseCount.mockResolvedValue(20);
    mockGetQuizAccessState.mockResolvedValue({
      isUnlocked: true,
      unlockedBy: "SUBSCRIPTION",
      expiresAt: new Date("2027-01-01"),
      activeQuizUnlockId: null,
    });

    const access = await resolveQuizPlayAccess({ quizId, ownerId });

    expect(access.isProActive).toBe(true);
    expect(access.isQuizUnlockedWithCoins).toBe(false);
    expect(access.canAcceptResponses).toBe(true);
  });

  it("treats null owner as free-only quota", async () => {
    mockGetQuizCompletedResponseCount.mockResolvedValue(20);

    const access = await resolveQuizPlayAccess({ quizId, ownerId: null });

    expect(mockGetQuizAccessState).not.toHaveBeenCalled();
    expect(access.canAcceptResponses).toBe(false);
  });
});

describe("getQuizPlayBlockErrorCode", () => {
  it("returns null when responses are accepted", () => {
    expect(getQuizPlayBlockErrorCode({ canAcceptResponses: true })).toBeNull();
  });

  it("returns free limit error when blocked", () => {
    expect(getQuizPlayBlockErrorCode({ canAcceptResponses: false })).toBe(
      QUIZ_ACTION_ERROR_CODE.FREE_RESPONSE_LIMIT_REACHED,
    );
  });
});
