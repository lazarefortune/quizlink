import type { QuizLinkResultAccessSnapshot } from "@/lib/quiz/quizLinkResultAccess";
import { resolveQuizResponseQuotaState } from "./quizResponseQuotaAccess";

export type QuizResponseQuotaUnlockedBy = "COINS" | "SUBSCRIPTION" | "ADMIN" | null;

export type QuizResponseQuotaLabel =
  | "FREE_AVAILABLE"
  | "FREE_LIMIT_REACHED"
  | "UNLOCKED"
  | "PRO_ACTIVE";

export type QuizResponseQuotaStatus = {
  completedResponses: number;
  freeLimit: number;
  remainingFreeResponses: number;
  hasReachedFreeLimit: boolean;
  isUnlocked: boolean;
  unlockedBy: QuizResponseQuotaUnlockedBy;
  label: QuizResponseQuotaLabel;
  canAcceptResponses: boolean;
};

export type ResolveQuizResponseQuotaStatusParams = {
  completedResponses: number;
  isProActive: boolean;
  isQuizUnlockedWithCoins: boolean;
  unlockedBy?: QuizResponseQuotaUnlockedBy;
};

export function resolveQuizResponseQuotaStatus(
  params: ResolveQuizResponseQuotaStatusParams,
): QuizResponseQuotaStatus {
  const quota = resolveQuizResponseQuotaState({
    completedResponses: params.completedResponses,
    isProActive: params.isProActive,
    isQuizUnlockedWithCoins: params.isQuizUnlockedWithCoins,
  });

  let label: QuizResponseQuotaLabel;
  let unlockedBy: QuizResponseQuotaUnlockedBy = params.unlockedBy ?? null;

  if (params.isProActive) {
    label = "PRO_ACTIVE";
    unlockedBy = "SUBSCRIPTION";
  } else if (params.isQuizUnlockedWithCoins) {
    label = "UNLOCKED";
    if (unlockedBy == null) {
      unlockedBy = "COINS";
    }
  } else if (quota.hasReachedFreeLimit) {
    label = "FREE_LIMIT_REACHED";
    unlockedBy = null;
  } else {
    label = "FREE_AVAILABLE";
    unlockedBy = null;
  }

  return {
    completedResponses: quota.completedResponses,
    freeLimit: quota.freeLimit,
    remainingFreeResponses: quota.remainingFreeResponses,
    hasReachedFreeLimit: quota.hasReachedFreeLimit,
    isUnlocked: quota.isUnlocked,
    unlockedBy,
    label,
    canAcceptResponses: quota.canAcceptResponses,
  };
}

export function resolveQuizResponseQuotaStatusFromResultAccess(params: {
  completedResponses: number;
  resultAccess: QuizLinkResultAccessSnapshot | null;
}): QuizResponseQuotaStatus {
  const resultAccess = params.resultAccess;
  const isProActive = resultAccess?.unlockedBy === "SUBSCRIPTION";
  const isQuizUnlockedWithCoins =
    (resultAccess?.isUnlocked ?? false) && resultAccess?.unlockedBy !== "SUBSCRIPTION";

  const unlockedBy: QuizResponseQuotaUnlockedBy =
    resultAccess?.unlockedBy === "SUBSCRIPTION"
      ? "SUBSCRIPTION"
      : resultAccess?.unlockedBy === "ADMIN"
        ? "ADMIN"
        : resultAccess?.isUnlocked
          ? "COINS"
          : null;

  return resolveQuizResponseQuotaStatus({
    completedResponses: params.completedResponses,
    isProActive,
    isQuizUnlockedWithCoins,
    unlockedBy,
  });
}

export type SerializedQuizResponseQuotaStatus = QuizResponseQuotaStatus;

export function serializeQuizResponseQuotaStatus(
  status: QuizResponseQuotaStatus,
): SerializedQuizResponseQuotaStatus {
  return { ...status };
}
