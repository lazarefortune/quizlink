export type QuizDetailsPurgeSkipReason =
  | "missing_accepting_responses_until"
  | "details_already_purged"
  | "not_expired"
  | "owner_pro_active"
  | "quiz_unlock_active"
  | "unlocked_until_guard_active"
  | "no_detailed_answers_or_personal_data";

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

  acceptingResponsesUntil: Date | null;
  detailsPurgedAt: Date | null;
  unlockedUntil: Date | null;

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
  acceptingResponsesUntil: Date;
  purgeEligibleAt: Date;
  counts: QuizDetailsPurgeCounts;
};

export type ExpiredQuizDetailsPurgePlanSummary = {
  quizzesScanned: number;
  quizzesEligible: number;
  linksScanned: number;
  linksEligible: number;
  linksSkippedPro: number;
  linksSkippedUnlock: number;
  linksSkippedNotExpired: number;
  attemptsEligible: number;
  answersEligible: number;
  participantNamesEligible: number;
  participantEmailsEligible: number;
  attemptsAlreadyPurgedOrNoAnswers: number;
  eligibleEntries: ExpiredQuizDetailsPurgePlanEntry[];
};

export function computePurgeEligibleAt(
  acceptingResponsesUntil: Date,
  graceDays: number,
): Date {
  return addDaysUTC(acceptingResponsesUntil, graceDays);
}

function addDaysUTC(base: Date, days: number): Date {
  // Avoid local timezone drift by computing from UTC epoch milliseconds.
  const ms = base.getTime() + days * 24 * 60 * 60 * 1000;
  return new Date(ms);
}

/**
 * Pure eligibility check (no DB, no side effects).
 *
 * A quiz link is eligible when:
 * - it has `acceptingResponsesUntil`
 * - `detailsPurgedAt` is null
 * - `acceptingResponsesUntil + graceDays < now`
 * - no active Pro for the owner
 * - no active QuizUnlock for the owner
 * - no `unlockedUntil` guard (when set)
 * - there is still detailed data/personals to purge (based on `counts`)
 */
export function computeExpiredQuizDetailsPurgeEligibility(
  input: QuizDetailsPurgeEligibilityInput,
): QuizDetailsPurgeEligibilityResult {
  if (input.acceptingResponsesUntil == null) {
    return { eligible: false, skipReason: "missing_accepting_responses_until" };
  }

  if (input.detailsPurgedAt != null) {
    return { eligible: false, skipReason: "details_already_purged" };
  }

  const purgeEligibleAt = addDaysUTC(input.acceptingResponsesUntil, input.graceDays);
  if (purgeEligibleAt >= input.now) {
    return { eligible: false, skipReason: "not_expired" };
  }

  if (input.unlockedUntil != null && input.unlockedUntil > input.now) {
    return { eligible: false, skipReason: "unlocked_until_guard_active" };
  }

  if (input.ownerProActive) {
    return { eligible: false, skipReason: "owner_pro_active" };
  }

  if (input.quizUnlockActive) {
    return { eligible: false, skipReason: "quiz_unlock_active" };
  }

  const hasAnythingToPurge =
    input.counts.attemptsEligible > 0 ||
    input.counts.answersEligible > 0 ||
    input.counts.participantNamesEligible > 0 ||
    input.counts.participantEmailsEligible > 0;

  if (!hasAnythingToPurge) {
    return {
      eligible: false,
      skipReason: "no_detailed_answers_or_personal_data",
    };
  }

  return {
    eligible: true,
    purgeEligibleAt,
    counts: input.counts,
  };
}

