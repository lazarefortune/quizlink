import { describe, expect, it } from "vitest";

import {
  resolveQuizResponseQuotaStatus,
  resolveQuizResponseQuotaStatusFromResultAccess,
} from "./quizResponseQuotaStatus";
import { FREE_QUIZ_RESPONSE_LIMIT } from "./quizUnlockConstants";

describe("resolveQuizResponseQuotaStatus", () => {
  it("returns FREE_AVAILABLE below the free limit", () => {
    const status = resolveQuizResponseQuotaStatus({
      completedResponses: 12,
      isProActive: false,
      isQuizUnlockedWithCoins: false,
    });

    expect(status.label).toBe("FREE_AVAILABLE");
    expect(status.completedResponses).toBe(12);
    expect(status.remainingFreeResponses).toBe(FREE_QUIZ_RESPONSE_LIMIT - 12);
    expect(status.canAcceptResponses).toBe(true);
  });

  it("returns FREE_LIMIT_REACHED at the free limit", () => {
    const status = resolveQuizResponseQuotaStatus({
      completedResponses: 20,
      isProActive: false,
      isQuizUnlockedWithCoins: false,
    });

    expect(status.label).toBe("FREE_LIMIT_REACHED");
    expect(status.hasReachedFreeLimit).toBe(true);
    expect(status.canAcceptResponses).toBe(false);
  });

  it("returns UNLOCKED when coin-unlocked at the limit", () => {
    const status = resolveQuizResponseQuotaStatus({
      completedResponses: 20,
      isProActive: false,
      isQuizUnlockedWithCoins: true,
      unlockedBy: "COINS",
    });

    expect(status.label).toBe("UNLOCKED");
    expect(status.unlockedBy).toBe("COINS");
    expect(status.canAcceptResponses).toBe(true);
  });

  it("returns PRO_ACTIVE when subscription is active", () => {
    const status = resolveQuizResponseQuotaStatus({
      completedResponses: 25,
      isProActive: true,
      isQuizUnlockedWithCoins: false,
    });

    expect(status.label).toBe("PRO_ACTIVE");
    expect(status.unlockedBy).toBe("SUBSCRIPTION");
    expect(status.canAcceptResponses).toBe(true);
  });
});

describe("resolveQuizResponseQuotaStatusFromResultAccess", () => {
  it("maps subscription unlock from result access snapshot", () => {
    const status = resolveQuizResponseQuotaStatusFromResultAccess({
      completedResponses: 20,
      resultAccess: {
        responsesStartedAt: new Date("2026-05-15T12:00:00Z"),
        isUnlocked: true,
        unlockedBy: "SUBSCRIPTION",
        detailedPreviewLimit: 25,
      },
    });

    expect(status.label).toBe("PRO_ACTIVE");
  });
});
