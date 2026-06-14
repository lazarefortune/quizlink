import { describe, expect, it } from "vitest";

import { formatQuizDetailHeaderQuotaLine } from "./formatQuizDetailHeaderQuotaLine";
import type { QuizResponseQuotaStatus } from "./quizResponseQuotaStatus";

function quota(overrides: Partial<QuizResponseQuotaStatus>): QuizResponseQuotaStatus {
  return {
    completedResponses: 0,
    freeLimit: 20,
    remainingFreeResponses: 20,
    hasReachedFreeLimit: false,
    isUnlocked: false,
    unlockedBy: null,
    label: "FREE_AVAILABLE",
    canAcceptResponses: true,
    ...overrides,
  };
}

describe("formatQuizDetailHeaderQuotaLine", () => {
  it("shows free progress for FREE_AVAILABLE", () => {
    const line = formatQuizDetailHeaderQuotaLine(
      quota({ completedResponses: 12, label: "FREE_AVAILABLE" }),
      "fr",
    );

    expect(line?.label).toBe("12 / 20 réponses gratuites utilisées");
    expect(line?.showUnlockAction).toBe(true);
    expect(line?.unlockActionVariant).toBe("secondary");
  });

  it("shows primary unlock CTA for FREE_LIMIT_REACHED", () => {
    const line = formatQuizDetailHeaderQuotaLine(
      quota({
        completedResponses: 20,
        label: "FREE_LIMIT_REACHED",
        hasReachedFreeLimit: true,
        canAcceptResponses: false,
      }),
      "fr",
    );

    expect(line?.label).toBe("20 / 20 réponses gratuites utilisées");
    expect(line?.showUnlockAction).toBe(true);
    expect(line?.unlockActionVariant).toBe("primary");
  });

  it("shows unlocked label without CTA", () => {
    const line = formatQuizDetailHeaderQuotaLine(
      quota({ label: "UNLOCKED", isUnlocked: true, unlockedBy: "COINS" }),
      "fr",
    );

    expect(line?.label).toBe("Quiz débloqué");
    expect(line?.showUnlockAction).toBe(false);
  });

  it("shows Pro label without CTA", () => {
    const line = formatQuizDetailHeaderQuotaLine(
      quota({ label: "PRO_ACTIVE", isUnlocked: true, unlockedBy: "SUBSCRIPTION" }),
      "fr",
    );

    expect(line?.label).toBe("Débloqué avec QuizLink Pro");
    expect(line?.showUnlockAction).toBe(false);
  });
});
