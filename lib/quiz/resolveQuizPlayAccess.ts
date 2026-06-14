import { getQuizAccessState } from "./getQuizAccessState";
import { getQuizCompletedResponseCount } from "./getQuizCompletedResponseCount";
import { resolveQuizResponseQuotaState } from "./quizResponseQuotaAccess";
import { QUIZ_ACTION_ERROR_CODE } from "./quizActionErrorCodes";

export type QuizPlayAccessState = {
  completedResponses: number;
  freeLimit: number;
  remainingFreeResponses: number;
  hasReachedFreeLimit: boolean;
  isProActive: boolean;
  isQuizUnlockedWithCoins: boolean;
  isUnlocked: boolean;
  canAcceptResponses: boolean;
  canViewAllDetails: boolean;
  canViewAdvancedStats: boolean;
};

export type ResolveQuizPlayAccessParams = {
  quizId: string;
  ownerId: string | null;
  now?: Date;
};

export async function resolveQuizPlayAccess({
  quizId,
  ownerId,
  now = new Date(),
}: ResolveQuizPlayAccessParams): Promise<QuizPlayAccessState> {
  const [completedResponses, accessState] = await Promise.all([
    getQuizCompletedResponseCount(quizId),
    ownerId != null
      ? getQuizAccessState({ quizId, userId: ownerId, now })
      : Promise.resolve({
          isUnlocked: false,
          unlockedBy: null,
          expiresAt: null,
          activeQuizUnlockId: null,
        }),
  ]);

  const isProActive = accessState.unlockedBy === "SUBSCRIPTION";
  const isQuizUnlockedWithCoins =
    accessState.isUnlocked && accessState.unlockedBy !== "SUBSCRIPTION";

  const quota = resolveQuizResponseQuotaState({
    completedResponses,
    isProActive,
    isQuizUnlockedWithCoins,
  });

  return {
    completedResponses: quota.completedResponses,
    freeLimit: quota.freeLimit,
    remainingFreeResponses: quota.remainingFreeResponses,
    hasReachedFreeLimit: quota.hasReachedFreeLimit,
    isProActive,
    isQuizUnlockedWithCoins,
    isUnlocked: quota.isUnlocked,
    canAcceptResponses: quota.canAcceptResponses,
    canViewAllDetails: quota.canViewAllDetails,
    canViewAdvancedStats: quota.canViewAdvancedStats,
  };
}

export function getQuizPlayBlockErrorCode(
  playAccess: Pick<QuizPlayAccessState, "canAcceptResponses">,
): string | null {
  if (playAccess.canAcceptResponses) {
    return null;
  }
  return QUIZ_ACTION_ERROR_CODE.FREE_RESPONSE_LIMIT_REACHED;
}
