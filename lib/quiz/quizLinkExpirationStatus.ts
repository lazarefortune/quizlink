import type { QuizAccessState } from "./getQuizAccessState";
import {
  buildQuizDetailCampaignSnapshot,
  type QuizLinkCampaignFields,
  type QuizLinkCampaignUiSnapshot,
  isQuizLinkAcceptingNewResponses,
} from "./quizLinkCampaign";

export type QuizLinkExpirationStatusType =
  | "NOT_STARTED"
  | "ACTIVE"
  | "EXPIRED"
  | "UNLOCKED"
  | "PRO_ACTIVE";

export type QuizLinkExpirationStatus = {
  hasStarted: boolean;
  isExpired: boolean;
  isUnlocked: boolean;
  acceptingResponsesUntil: Date | null;
  status: QuizLinkExpirationStatusType;
  titleKey: string;
  descriptionKey: string;
  listLabelKey: string;
  daysRemaining?: number;
};

const EXPIRATION_TITLE_KEYS: Record<QuizLinkExpirationStatusType, string> = {
  NOT_STARTED: "dashboard.quizExpiration.notStartedTitle",
  ACTIVE: "dashboard.quizExpiration.activeTitle",
  EXPIRED: "dashboard.quizExpiration.expiredTitle",
  UNLOCKED: "dashboard.quizExpiration.unlockedTitle",
  PRO_ACTIVE: "dashboard.quizExpiration.proTitle",
};

const EXPIRATION_DESCRIPTION_KEYS: Record<QuizLinkExpirationStatusType, string> = {
  NOT_STARTED: "dashboard.quizExpiration.notStartedDescription",
  ACTIVE: "dashboard.quizExpiration.activeDescription",
  EXPIRED: "dashboard.quizExpiration.expiredDescription",
  UNLOCKED: "dashboard.quizExpiration.unlockedDescription",
  PRO_ACTIVE: "dashboard.quizExpiration.proDescription",
};

const EXPIRATION_LIST_LABEL_KEYS: Record<QuizLinkExpirationStatusType, string> = {
  NOT_STARTED: "dashboard.quizExpiration.listNotStarted",
  ACTIVE: "dashboard.quizExpiration.listActive",
  EXPIRED: "dashboard.quizExpiration.listExpired",
  UNLOCKED: "dashboard.quizExpiration.listUnlocked",
  PRO_ACTIVE: "dashboard.quizExpiration.listProActive",
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function computeDaysRemaining(until: Date, now: Date): number {
  const diffMs = until.getTime() - now.getTime();
  if (diffMs <= 0) {
    return 0;
  }
  return Math.ceil(diffMs / MS_PER_DAY);
}

function buildQuizLinkExpirationStatus(
  status: QuizLinkExpirationStatusType,
  acceptingResponsesUntil: Date | null,
  hasStarted: boolean,
  now: Date,
): QuizLinkExpirationStatus {
  const isExpired = status === "EXPIRED";
  const isUnlocked = status === "UNLOCKED" || status === "PRO_ACTIVE";

  return {
    hasStarted,
    isExpired,
    isUnlocked,
    acceptingResponsesUntil,
    status,
    titleKey: EXPIRATION_TITLE_KEYS[status],
    descriptionKey: EXPIRATION_DESCRIPTION_KEYS[status],
    listLabelKey: EXPIRATION_LIST_LABEL_KEYS[status],
    daysRemaining:
      acceptingResponsesUntil != null && !isExpired
        ? computeDaysRemaining(acceptingResponsesUntil, now)
        : undefined,
  };
}

export function resolveQuizLinkExpirationStatusFromCampaign(
  campaign: QuizLinkCampaignUiSnapshot | null,
  now: Date = new Date(),
): QuizLinkExpirationStatus {
  if (campaign == null || campaign.responsesStartedAt == null) {
    return buildQuizLinkExpirationStatus("NOT_STARTED", null, false, now);
  }

  if (campaign.unlockedBy === "SUBSCRIPTION") {
    return buildQuizLinkExpirationStatus(
      "PRO_ACTIVE",
      campaign.acceptingResponsesUntil,
      true,
      now,
    );
  }

  if (campaign.isUnlocked) {
    return buildQuizLinkExpirationStatus(
      "UNLOCKED",
      campaign.acceptingResponsesUntil,
      true,
      now,
    );
  }

  if (!campaign.isAcceptingResponses) {
    return buildQuizLinkExpirationStatus(
      "EXPIRED",
      campaign.acceptingResponsesUntil,
      true,
      now,
    );
  }

  return buildQuizLinkExpirationStatus(
    "ACTIVE",
    campaign.acceptingResponsesUntil,
    true,
    now,
  );
}

export type ResolveQuizLinkExpirationStatusInput = {
  link: QuizLinkCampaignFields | null;
  access?: QuizAccessState | null;
  now?: Date;
};

/**
 * Creator-facing expiration state from raw link fields + optional owner access.
 */
export function resolveQuizLinkExpirationStatus({
  link,
  access = null,
  now = new Date(),
}: ResolveQuizLinkExpirationStatusInput): QuizLinkExpirationStatus {
  const campaign = buildQuizDetailCampaignSnapshot(
    link,
    access ?? {
      isUnlocked: false,
      unlockedBy: null,
      expiresAt: null,
      activeQuizUnlockId: null,
    },
    now,
  );

  return resolveQuizLinkExpirationStatusFromCampaign(campaign, now);
}

/**
 * Participant-facing: whether new responses are accepted (link fields only).
 */
export function isQuizLinkExpiredForParticipants(
  link: QuizLinkCampaignFields | null,
  now: Date = new Date(),
): boolean {
  if (link == null) {
    return false;
  }
  return !isQuizLinkAcceptingNewResponses(link, now);
}

export function formatQuizExpirationDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
