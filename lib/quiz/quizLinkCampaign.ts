import type { QuizAccessState } from "./getQuizAccessState";

/** Free response campaign length (days) from first real attempt. */
export const FREE_CAMPAIGN_DAYS = 7;

/** Max detailed attempt rows visible to creator during free campaign. */
export const FREE_DETAILED_ATTEMPTS_LIMIT = 3;

/** Unlocked links load more rows per page (future pagination). */
export const UNLOCKED_DETAILED_ATTEMPTS_PAGE_SIZE = 25;

export const QUIZ_LINK_CAMPAIGN_ERROR = {
  NO_LONGER_ACCEPTING_RESPONSES: "QUIZ_NO_LONGER_ACCEPTING_RESPONSES",
} as const;

export type QuizLinkCampaignDates = {
  responsesStartedAt: Date;
  acceptingResponsesUntil: Date;
  detailsVisibleUntil: Date;
};

export type QuizLinkCampaignFields = {
  responsesStartedAt: Date | null;
  acceptingResponsesUntil: Date | null;
  detailsVisibleUntil: Date | null;
  unlockedUntil: Date | null;
};

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getQuizLinkCampaignDates(now: Date): QuizLinkCampaignDates {
  const acceptingResponsesUntil = addDays(now, FREE_CAMPAIGN_DAYS);
  return {
    responsesStartedAt: now,
    acceptingResponsesUntil,
    detailsVisibleUntil: acceptingResponsesUntil,
  };
}

export function isQuizLinkUnlocked(
  link: Pick<QuizLinkCampaignFields, "unlockedUntil">,
  now: Date = new Date(),
): boolean {
  return link.unlockedUntil != null && link.unlockedUntil > now;
}

/**
 * Whether new attempts may be started on this link.
 * Campaign not started yet → always allowed.
 */
export function isQuizLinkAcceptingNewResponses(
  link: QuizLinkCampaignFields,
  now: Date = new Date(),
): boolean {
  if (isQuizLinkUnlocked(link, now)) {
    return true;
  }
  if (link.responsesStartedAt == null) {
    return true;
  }
  if (link.acceptingResponsesUntil == null) {
    return true;
  }
  return link.acceptingResponsesUntil >= now;
}

export function getQuizLinkCampaignBlockError(
  link: QuizLinkCampaignFields,
  now: Date = new Date(),
): string | null {
  if (isQuizLinkAcceptingNewResponses(link, now)) {
    return null;
  }
  return QUIZ_LINK_CAMPAIGN_ERROR.NO_LONGER_ACCEPTING_RESPONSES;
}

export function getDetailedAttemptsPreviewLimit(
  link: QuizLinkCampaignFields,
  now: Date = new Date(),
): number {
  if (isQuizLinkUnlocked(link, now)) {
    return UNLOCKED_DETAILED_ATTEMPTS_PAGE_SIZE;
  }
  return FREE_DETAILED_ATTEMPTS_LIMIT;
}

export function isQuizLinkFreePeriodActive(
  link: Pick<QuizLinkCampaignFields, "acceptingResponsesUntil">,
  now: Date = new Date(),
): boolean {
  if (link.acceptingResponsesUntil == null) {
    return true;
  }
  return link.acceptingResponsesUntil >= now;
}

export type QuizUnlockedByUi = "QUIZ_UNLOCK" | "SUBSCRIPTION" | "ADMIN" | null;

export type QuizLinkCampaignUiSnapshot = {
  responsesStartedAt: Date | null;
  acceptingResponsesUntil: Date | null;
  detailsVisibleUntil: Date | null;
  unlockedUntil: Date | null;
  isFreePeriodActive: boolean;
  isAcceptingResponses: boolean;
  isUnlocked: boolean;
  unlockedBy: QuizUnlockedByUi;
  detailedPreviewLimit: number;
};

export function buildQuizLinkCampaignUiSnapshot(
  link: QuizLinkCampaignFields,
  now: Date = new Date(),
): QuizLinkCampaignUiSnapshot {
  const linkUnlocked = isQuizLinkUnlocked(link, now);
  return {
    responsesStartedAt: link.responsesStartedAt,
    acceptingResponsesUntil: link.acceptingResponsesUntil,
    detailsVisibleUntil: link.detailsVisibleUntil,
    unlockedUntil: link.unlockedUntil,
    isFreePeriodActive: isQuizLinkFreePeriodActive(link, now),
    isAcceptingResponses: isQuizLinkAcceptingNewResponses(link, now),
    isUnlocked: linkUnlocked,
    unlockedBy: linkUnlocked ? "QUIZ_UNLOCK" : null,
    detailedPreviewLimit: getDetailedAttemptsPreviewLimit(link, now),
  };
}

/**
 * Dashboard campaign snapshot: link fields + owner access (QuizUnlock / Pro).
 */
export function buildQuizDetailCampaignSnapshot(
  link: QuizLinkCampaignFields | null,
  access: QuizAccessState,
  now: Date = new Date(),
): QuizLinkCampaignUiSnapshot | null {
  if (!link) {
    return null;
  }

  const base = buildQuizLinkCampaignUiSnapshot(link, now);

  if (!access.isUnlocked) {
    return {
      ...base,
      isUnlocked: false,
      unlockedBy: null,
      detailedPreviewLimit: FREE_DETAILED_ATTEMPTS_LIMIT,
    };
  }

  const effectiveUnlockedUntil =
    access.expiresAt != null
      ? access.expiresAt
      : link.unlockedUntil;

  const mergedLink: QuizLinkCampaignFields = {
    ...link,
    unlockedUntil: effectiveUnlockedUntil,
    acceptingResponsesUntil:
      effectiveUnlockedUntil != null &&
      (link.acceptingResponsesUntil == null ||
        link.acceptingResponsesUntil < effectiveUnlockedUntil)
        ? effectiveUnlockedUntil
        : link.acceptingResponsesUntil,
    detailsVisibleUntil:
      effectiveUnlockedUntil != null &&
      (link.detailsVisibleUntil == null ||
        link.detailsVisibleUntil < effectiveUnlockedUntil)
        ? effectiveUnlockedUntil
        : link.detailsVisibleUntil,
  };

  return {
    ...buildQuizLinkCampaignUiSnapshot(mergedLink, now),
    isUnlocked: true,
    unlockedBy: access.unlockedBy,
    unlockedUntil: access.expiresAt ?? base.unlockedUntil,
    detailedPreviewLimit: UNLOCKED_DETAILED_ATTEMPTS_PAGE_SIZE,
  };
}
