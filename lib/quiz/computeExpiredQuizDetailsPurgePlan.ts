import { FREE_QUIZ_RESPONSE_LIMIT } from "./quizUnlockConstants";

export type QuizDetailsPurgeSkipReason =
  | "free_limit_not_reached"
  | "no_recent_activity"
  | "within_grace_period"
  | "pro_active"
  | "unlock_active"
  | "already_purged"
  | "nothing_to_purge"
  | "safety";

export type QuizDetailsPurgeCounts = {
  attemptsEligible: number;
  answersEligible: number;
  participantNamesEligible: number;
  participantEmailsEligible: number;
  attemptsAlreadyPurgedOrNoAnswers: number;
};

export type QuizDetailsPurgeEligibilityInput = {
  quizId: string;
  quizTitle: string | null;
  ownerId: string;
  quizLinkId: string;

  completedResponses: number;
  freeLimit: number;
  lastActivityAt: Date | null;
  detailsPurgedAt: Date | null;

  now: Date;
  graceDays: number;

  ownerProActive: boolean;
  quizUnlockActive: boolean;

  counts: QuizDetailsPurgeCounts;
};

export type QuizDetailsPurgeEligibilityResult =
  | {
      eligible: true;
      purgeEligibleAt: Date;
      counts: QuizDetailsPurgeCounts;
    }
  | {
      eligible: false;
      skipReason: QuizDetailsPurgeSkipReason;
    };

export type ExpiredQuizDetailsPurgePlanEntry = {
  quizId: string;
  quizTitle: string | null;
  ownerId: string;
  quizLinkId: string;
  completedResponses: number;
  freeLimit: number;
  lastActivityAt: Date;
  purgeEligibleAt: Date;
  counts: QuizDetailsPurgeCounts;
};

export type ExpiredQuizDetailsPurgePlanSummary = {
  quizzesScanned: number;
  quizzesEligible: number;
  linksScanned: number;
  linksEligible: number;
  linksSkippedFreeLimitNotReached: number;
  linksSkippedWithinGracePeriod: number;
  linksSkippedNoRecentActivity: number;
  linksSkippedPro: number;
  linksSkippedUnlock: number;
  linksSkippedAlreadyPurged: number;
  linksSkippedNothingToPurge: number;
  linksSkippedSafety: number;
  attemptsEligible: number;
  answersEligible: number;
  participantNamesEligible: number;
  participantEmailsEligible: number;
  attemptsAlreadyPurgedOrNoAnswers: number;
  eligibleEntries: ExpiredQuizDetailsPurgePlanEntry[];
};

export type ResolveQuizLinkLastActivityAtInput = {
  lastResponseAt: Date | null;
  latestAttemptFinishedAt: Date | null;
  latestAttemptStartedAt: Date | null;
};

export function createEmptyExpiredQuizDetailsPurgePlanSummary(): ExpiredQuizDetailsPurgePlanSummary {
  return {
    quizzesScanned: 0,
    quizzesEligible: 0,
    linksScanned: 0,
    linksEligible: 0,
    linksSkippedFreeLimitNotReached: 0,
    linksSkippedWithinGracePeriod: 0,
    linksSkippedNoRecentActivity: 0,
    linksSkippedPro: 0,
    linksSkippedUnlock: 0,
    linksSkippedAlreadyPurged: 0,
    linksSkippedNothingToPurge: 0,
    linksSkippedSafety: 0,
    attemptsEligible: 0,
    answersEligible: 0,
    participantNamesEligible: 0,
    participantEmailsEligible: 0,
    attemptsAlreadyPurgedOrNoAnswers: 0,
    eligibleEntries: [],
  };
}

export function incrementPurgePlanSkipCounter(
  summary: ExpiredQuizDetailsPurgePlanSummary,
  skipReason: QuizDetailsPurgeSkipReason,
): void {
  switch (skipReason) {
    case "free_limit_not_reached":
      summary.linksSkippedFreeLimitNotReached += 1;
      break;
    case "within_grace_period":
      summary.linksSkippedWithinGracePeriod += 1;
      break;
    case "no_recent_activity":
      summary.linksSkippedNoRecentActivity += 1;
      break;
    case "pro_active":
      summary.linksSkippedPro += 1;
      break;
    case "unlock_active":
      summary.linksSkippedUnlock += 1;
      break;
    case "already_purged":
      summary.linksSkippedAlreadyPurged += 1;
      break;
    case "nothing_to_purge":
      summary.linksSkippedNothingToPurge += 1;
      break;
    case "safety":
      summary.linksSkippedSafety += 1;
      break;
    default: {
      const exhaustive: never = skipReason;
      throw new Error(`Unknown purge skip reason: ${exhaustive}`);
    }
  }
}

export function computePurgeEligibleAt(lastActivityAt: Date, graceDays: number): Date {
  return addDaysUTC(lastActivityAt, graceDays);
}

function addDaysUTC(base: Date, days: number): Date {
  const ms = base.getTime() + days * 24 * 60 * 60 * 1000;
  return new Date(ms);
}

/**
 * Resolves the last activity timestamp for a quiz link.
 * Priority: lastResponseAt → latest finishedAt → latest startedAt.
 */
export function resolveQuizLinkLastActivityAt(
  input: ResolveQuizLinkLastActivityAtInput,
): Date | null {
  if (input.lastResponseAt != null) {
    return input.lastResponseAt;
  }

  if (input.latestAttemptFinishedAt != null) {
    return input.latestAttemptFinishedAt;
  }

  if (input.latestAttemptStartedAt != null) {
    return input.latestAttemptStartedAt;
  }

  return null;
}

/**
 * Pure eligibility check (no DB, no side effects).
 *
 * A quiz link is eligible when:
 * - free completed responses >= FREE_QUIZ_RESPONSE_LIMIT
 * - `detailsPurgedAt` is null
 * - `lastActivityAt + graceDays < now`
 * - no active Pro for the owner
 * - no active QuizUnlock for the owner (including permanent `expiresAt = null`)
 * - there is still detailed data/personals to purge (based on `counts`)
 */
export function computeExpiredQuizDetailsPurgeEligibility(
  input: QuizDetailsPurgeEligibilityInput,
): QuizDetailsPurgeEligibilityResult {
  if (input.detailsPurgedAt != null) {
    return { eligible: false, skipReason: "already_purged" };
  }

  if (input.ownerProActive) {
    return { eligible: false, skipReason: "pro_active" };
  }

  if (input.quizUnlockActive) {
    return { eligible: false, skipReason: "unlock_active" };
  }

  if (input.completedResponses < input.freeLimit) {
    return { eligible: false, skipReason: "free_limit_not_reached" };
  }

  if (input.lastActivityAt == null) {
    return { eligible: false, skipReason: "no_recent_activity" };
  }

  const purgeEligibleAt = computePurgeEligibleAt(input.lastActivityAt, input.graceDays);
  if (purgeEligibleAt >= input.now) {
    return { eligible: false, skipReason: "within_grace_period" };
  }

  const hasAnythingToPurge =
    input.counts.attemptsEligible > 0 ||
    input.counts.answersEligible > 0 ||
    input.counts.participantNamesEligible > 0 ||
    input.counts.participantEmailsEligible > 0;

  if (!hasAnythingToPurge) {
    return { eligible: false, skipReason: "nothing_to_purge" };
  }

  return {
    eligible: true,
    purgeEligibleAt,
    counts: input.counts,
  };
}

export const DEFAULT_PURGE_FREE_LIMIT = FREE_QUIZ_RESPONSE_LIMIT;
