import { describe, expect, it } from "vitest";

import {
  buildQuizDetailResultAccessSnapshot,
  FREE_DETAILED_ATTEMPTS_LIMIT,
  getDetailedAttemptsPreviewLimit,
  UNLOCKED_DETAILED_ATTEMPTS_PAGE_SIZE,
} from "./quizLinkResultAccess";

describe("quizLinkResultAccess", () => {
  it("limits preview rows on free tier", () => {
    expect(getDetailedAttemptsPreviewLimit(false)).toBe(FREE_DETAILED_ATTEMPTS_LIMIT);
    expect(getDetailedAttemptsPreviewLimit(true)).toBe(UNLOCKED_DETAILED_ATTEMPTS_PAGE_SIZE);
  });

  it("buildQuizDetailResultAccessSnapshot reflects owner access", () => {
    const link = { responsesStartedAt: new Date("2026-05-15T12:00:00Z") };

    const locked = buildQuizDetailResultAccessSnapshot(link, {
      isUnlocked: false,
      unlockedBy: null,
      expiresAt: null,
      activeQuizUnlockId: null,
    });
    expect(locked?.isUnlocked).toBe(false);
    expect(locked?.detailedPreviewLimit).toBe(FREE_DETAILED_ATTEMPTS_LIMIT);

    const unlocked = buildQuizDetailResultAccessSnapshot(link, {
      isUnlocked: true,
      unlockedBy: "QUIZ_UNLOCK",
      expiresAt: null,
      activeQuizUnlockId: "unlock-1",
    });
    expect(unlocked?.isUnlocked).toBe(true);
    expect(unlocked?.unlockedBy).toBe("QUIZ_UNLOCK");
    expect(unlocked?.detailedPreviewLimit).toBe(UNLOCKED_DETAILED_ATTEMPTS_PAGE_SIZE);
  });

  it("returns null when no public link exists", () => {
    expect(
      buildQuizDetailResultAccessSnapshot(null, {
        isUnlocked: false,
        unlockedBy: null,
        expiresAt: null,
        activeQuizUnlockId: null,
      }),
    ).toBeNull();
  });
});
