import { FREE_QUIZ_RESPONSE_LIMIT } from "./quizUnlockConstants";

export type QuizResponseQuotaInput = {
  completedResponses: number;
  isProActive: boolean;
  isQuizUnlockedWithCoins: boolean;
};

export type QuizResponseQuotaState = {
  freeLimit: number;
  completedResponses: number;
  remainingFreeResponses: number;
  hasReachedFreeLimit: boolean;
  isUnlocked: boolean;
  canAcceptResponses: boolean;
  canViewAllDetails: boolean;
  canViewAdvancedStats: boolean;
};

export function resolveQuizResponseQuotaState(
  params: QuizResponseQuotaInput,
): QuizResponseQuotaState {
  const completedResponses = Math.max(0, params.completedResponses);
  const isUnlocked = params.isProActive || params.isQuizUnlockedWithCoins;
  const remainingFreeResponses = Math.max(
    0,
    FREE_QUIZ_RESPONSE_LIMIT - completedResponses,
  );
  const hasReachedFreeLimit = completedResponses >= FREE_QUIZ_RESPONSE_LIMIT;
  const canAcceptResponses =
    isUnlocked || completedResponses < FREE_QUIZ_RESPONSE_LIMIT;
  const canViewAllDetails = isUnlocked;
  const canViewAdvancedStats = isUnlocked;

  return {
    freeLimit: FREE_QUIZ_RESPONSE_LIMIT,
    completedResponses,
    remainingFreeResponses,
    hasReachedFreeLimit,
    isUnlocked,
    canAcceptResponses,
    canViewAllDetails,
    canViewAdvancedStats,
  };
}

export function canAcceptQuizResponses(params: QuizResponseQuotaInput): boolean {
  return resolveQuizResponseQuotaState(params).canAcceptResponses;
}

export function canViewAllQuizDetails(params: QuizResponseQuotaInput): boolean {
  return resolveQuizResponseQuotaState(params).canViewAllDetails;
}

export function canViewAdvancedQuizStats(
  params: QuizResponseQuotaInput,
): boolean {
  return resolveQuizResponseQuotaState(params).canViewAdvancedStats;
}
