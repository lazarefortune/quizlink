import { describe, expect, it } from "vitest";

import type { QuizAccessState } from "./getQuizAccessState";
import {
  computeDaysRemaining,
  isQuizLinkExpiredForParticipants,
  resolveQuizLinkExpirationStatus,
  resolveQuizLinkExpirationStatusFromCampaign,
} from "./quizLinkExpirationStatus";
import type { QuizLinkCampaignUiSnapshot } from "./quizLinkCampaign";

const now = new Date("2026-05-27T12:00:00.000Z");

function daysFromNow(days: number): Date {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return date;
}

const lockedAccess: QuizAccessState = {
  isUnlocked: false,
  unlockedBy: null,
  expiresAt: null,
  activeQuizUnlockId: null,
};

describe("resolveQuizLinkExpirationStatus", () => {
  it("returns NOT_STARTED when campaign has not started", () => {
    const status = resolveQuizLinkExpirationStatus({
      link: {
        responsesStartedAt: null,
        acceptingResponsesUntil: null,
        detailsVisibleUntil: null,
        unlockedUntil: null,
      },
      access: lockedAccess,
      now,
    });

    expect(status.status).toBe("NOT_STARTED");
    expect(status.isExpired).toBe(false);
    expect(status.hasStarted).toBe(false);
  });

  it("returns ACTIVE when free period is still open", () => {
    const status = resolveQuizLinkExpirationStatus({
      link: {
        responsesStartedAt: daysFromNow(-2),
        acceptingResponsesUntil: daysFromNow(5),
        detailsVisibleUntil: daysFromNow(5),
        unlockedUntil: null,
      },
      access: lockedAccess,
      now,
    });

    expect(status.status).toBe("ACTIVE");
    expect(status.isExpired).toBe(false);
    expect(status.daysRemaining).toBe(5);
  });

  it("returns EXPIRED when acceptingResponsesUntil is in the past", () => {
    const status = resolveQuizLinkExpirationStatus({
      link: {
        responsesStartedAt: daysFromNow(-10),
        acceptingResponsesUntil: daysFromNow(-1),
        detailsVisibleUntil: daysFromNow(-1),
        unlockedUntil: null,
      },
      access: lockedAccess,
      now,
    });

    expect(status.status).toBe("EXPIRED");
    expect(status.isExpired).toBe(true);
  });

  it("returns UNLOCKED when coin unlock extends the link", () => {
    const status = resolveQuizLinkExpirationStatus({
      link: {
        responsesStartedAt: daysFromNow(-10),
        acceptingResponsesUntil: daysFromNow(-1),
        detailsVisibleUntil: daysFromNow(-1),
        unlockedUntil: daysFromNow(30),
      },
      access: {
        isUnlocked: true,
        unlockedBy: "QUIZ_UNLOCK",
        expiresAt: daysFromNow(30),
        activeQuizUnlockId: "unlock-1",
      },
      now,
    });

    expect(status.status).toBe("UNLOCKED");
    expect(status.isExpired).toBe(false);
    expect(status.isUnlocked).toBe(true);
  });

  it("returns PRO_ACTIVE when subscription access is active", () => {
    const status = resolveQuizLinkExpirationStatus({
      link: {
        responsesStartedAt: daysFromNow(-10),
        acceptingResponsesUntil: daysFromNow(-1),
        detailsVisibleUntil: daysFromNow(-1),
        unlockedUntil: null,
      },
      access: {
        isUnlocked: true,
        unlockedBy: "SUBSCRIPTION",
        expiresAt: daysFromNow(20),
        activeQuizUnlockId: null,
      },
      now,
    });

    expect(status.status).toBe("PRO_ACTIVE");
    expect(status.isExpired).toBe(false);
    expect(status.titleKey).toBe("dashboard.quizExpiration.proTitle");
  });
});

describe("resolveQuizLinkExpirationStatusFromCampaign", () => {
  it("maps campaign snapshot statuses", () => {
    const activeCampaign: QuizLinkCampaignUiSnapshot = {
      responsesStartedAt: daysFromNow(-1),
      acceptingResponsesUntil: daysFromNow(3),
      detailsVisibleUntil: daysFromNow(3),
      unlockedUntil: null,
      isFreePeriodActive: true,
      isAcceptingResponses: true,
      isUnlocked: false,
      unlockedBy: null,
      detailedPreviewLimit: 3,
    };

    expect(resolveQuizLinkExpirationStatusFromCampaign(activeCampaign, now).status).toBe(
      "ACTIVE",
    );
  });
});

describe("isQuizLinkExpiredForParticipants", () => {
  it("returns false before campaign starts", () => {
    expect(
      isQuizLinkExpiredForParticipants(
        {
          responsesStartedAt: null,
          acceptingResponsesUntil: null,
          detailsVisibleUntil: null,
          unlockedUntil: null,
        },
        now,
      ),
    ).toBe(false);
  });

  it("returns true when link expired without unlock", () => {
    expect(
      isQuizLinkExpiredForParticipants(
        {
          responsesStartedAt: daysFromNow(-10),
          acceptingResponsesUntil: daysFromNow(-1),
          detailsVisibleUntil: daysFromNow(-1),
          unlockedUntil: null,
        },
        now,
      ),
    ).toBe(true);
  });
});

describe("computeDaysRemaining", () => {
  it("returns zero for past dates", () => {
    expect(computeDaysRemaining(daysFromNow(-1), now)).toBe(0);
  });
});
