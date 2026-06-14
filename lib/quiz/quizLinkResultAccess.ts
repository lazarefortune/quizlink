import type { QuizAccessState } from "./getQuizAccessState";

/** Max detailed attempt rows visible to creator on the free tier. */
export const FREE_DETAILED_ATTEMPTS_LIMIT = 3;

/** Unlocked quizzes load more rows per page (future pagination). */
export const UNLOCKED_DETAILED_ATTEMPTS_PAGE_SIZE = 25;

export type QuizLinkResultAccessFields = {
  responsesStartedAt: Date | null;
};

export type QuizUnlockedByUi = "QUIZ_UNLOCK" | "SUBSCRIPTION" | "ADMIN" | null;

export type QuizLinkResultAccessSnapshot = {
  responsesStartedAt: Date | null;
  isUnlocked: boolean;
  unlockedBy: QuizUnlockedByUi;
  detailedPreviewLimit: number;
};

export function getDetailedAttemptsPreviewLimit(isUnlocked: boolean): number {
  if (isUnlocked) {
    return UNLOCKED_DETAILED_ATTEMPTS_PAGE_SIZE;
  }
  return FREE_DETAILED_ATTEMPTS_LIMIT;
}

/**
 * Dashboard result-access snapshot: preview limit + owner unlock state (QuizUnlock / Pro).
 */
export function buildQuizDetailResultAccessSnapshot(
  link: QuizLinkResultAccessFields | null,
  access: QuizAccessState,
): QuizLinkResultAccessSnapshot | null {
  if (!link) {
    return null;
  }

  return {
    responsesStartedAt: link.responsesStartedAt,
    isUnlocked: access.isUnlocked,
    unlockedBy: access.isUnlocked ? access.unlockedBy : null,
    detailedPreviewLimit: getDetailedAttemptsPreviewLimit(access.isUnlocked),
  };
}
