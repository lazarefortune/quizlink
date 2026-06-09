import { describe, expect, it } from "vitest";

import {
  FREE_CAMPAIGN_DAYS,
  FREE_DETAILED_ATTEMPTS_LIMIT,
  QUIZ_LINK_CAMPAIGN_ERROR,
  addDays,
  buildQuizDetailCampaignSnapshot,
  buildQuizLinkCampaignUiSnapshot,
  getDetailedAttemptsPreviewLimit,
  getQuizLinkCampaignBlockError,
  getQuizLinkCampaignDates,
  isQuizLinkAcceptingNewResponses,
  isQuizLinkUnlocked,
} from "./quizLinkCampaign";

const baseNow = new Date("2026-05-22T12:00:00Z");

describe("quizLinkCampaign", () => {
  it("getQuizLinkCampaignDates adds 7 days to accepting and details windows", () => {
    const dates = getQuizLinkCampaignDates(baseNow);
    expect(dates.responsesStartedAt).toEqual(baseNow);
    expect(dates.acceptingResponsesUntil).toEqual(addDays(baseNow, FREE_CAMPAIGN_DAYS));
    expect(dates.detailsVisibleUntil).toEqual(dates.acceptingResponsesUntil);
  });

  it("allows responses before campaign starts", () => {
    expect(
      isQuizLinkAcceptingNewResponses({
        responsesStartedAt: null,
        acceptingResponsesUntil: null,
        detailsVisibleUntil: null,
        unlockedUntil: null,
      }),
    ).toBe(true);
  });

  it("blocks responses after acceptingResponsesUntil when not unlocked", () => {
    const expired = new Date("2026-05-20T12:00:00Z");
    const link = {
      responsesStartedAt: new Date("2026-05-13T12:00:00Z"),
      acceptingResponsesUntil: expired,
      detailsVisibleUntil: expired,
      unlockedUntil: null,
    };
    const now = new Date("2026-05-22T12:00:00Z");
    expect(isQuizLinkAcceptingNewResponses(link, now)).toBe(false);
    expect(getQuizLinkCampaignBlockError(link, now)).toBe(
      QUIZ_LINK_CAMPAIGN_ERROR.NO_LONGER_ACCEPTING_RESPONSES,
    );
  });

  it("allows responses when unlockedUntil is in the future despite expired campaign", () => {
    const link = {
      responsesStartedAt: new Date("2026-05-13T12:00:00Z"),
      acceptingResponsesUntil: new Date("2026-05-20T12:00:00Z"),
      detailsVisibleUntil: new Date("2026-05-20T12:00:00Z"),
      unlockedUntil: new Date("2026-07-01T12:00:00Z"),
    };
    const now = new Date("2026-05-22T12:00:00Z");
    expect(isQuizLinkUnlocked(link, now)).toBe(true);
    expect(isQuizLinkAcceptingNewResponses(link, now)).toBe(true);
    expect(getQuizLinkCampaignBlockError(link, now)).toBeNull();
  });

  it("limits detailed preview to 3 unless unlocked", () => {
    const freeLink = {
      responsesStartedAt: baseNow,
      acceptingResponsesUntil: addDays(baseNow, 7),
      detailsVisibleUntil: addDays(baseNow, 7),
      unlockedUntil: null,
    };
    expect(getDetailedAttemptsPreviewLimit(freeLink)).toBe(FREE_DETAILED_ATTEMPTS_LIMIT);

    const unlockedLink = {
      ...freeLink,
      unlockedUntil: addDays(baseNow, 30),
    };
    expect(getDetailedAttemptsPreviewLimit(unlockedLink)).toBe(25);
  });

  it("buildQuizLinkCampaignUiSnapshot reflects active vs ended free period", () => {
    const active = buildQuizLinkCampaignUiSnapshot({
      responsesStartedAt: baseNow,
      acceptingResponsesUntil: addDays(baseNow, 7),
      detailsVisibleUntil: addDays(baseNow, 7),
      unlockedUntil: null,
    });
    expect(active.isFreePeriodActive).toBe(true);
    expect(active.isAcceptingResponses).toBe(true);
    expect(active.unlockedBy).toBeNull();

    const ended = buildQuizLinkCampaignUiSnapshot(
      {
        responsesStartedAt: new Date("2026-05-01T12:00:00Z"),
        acceptingResponsesUntil: new Date("2026-05-08T12:00:00Z"),
        detailsVisibleUntil: new Date("2026-05-08T12:00:00Z"),
        unlockedUntil: null,
      },
      new Date("2026-05-22T12:00:00Z"),
    );
    expect(ended.isFreePeriodActive).toBe(false);
    expect(ended.isAcceptingResponses).toBe(false);
  });

  it("buildQuizDetailCampaignSnapshot uses access state over link-only unlock", () => {
    const link = {
      responsesStartedAt: baseNow,
      acceptingResponsesUntil: addDays(baseNow, 7),
      detailsVisibleUntil: addDays(baseNow, 7),
      unlockedUntil: null,
    };
    const locked = buildQuizDetailCampaignSnapshot(link, {
      isUnlocked: false,
      unlockedBy: null,
      expiresAt: null,
      activeQuizUnlockId: null,
    });
    expect(locked?.isUnlocked).toBe(false);
    expect(locked?.detailedPreviewLimit).toBe(FREE_DETAILED_ATTEMPTS_LIMIT);

    const unlocked = buildQuizDetailCampaignSnapshot(link, {
      isUnlocked: true,
      unlockedBy: "QUIZ_UNLOCK",
      expiresAt: addDays(baseNow, 60),
      activeQuizUnlockId: "unlock-1",
    });
    expect(unlocked?.isUnlocked).toBe(true);
    expect(unlocked?.unlockedBy).toBe("QUIZ_UNLOCK");
    expect(unlocked?.detailedPreviewLimit).toBe(25);
  });
});
