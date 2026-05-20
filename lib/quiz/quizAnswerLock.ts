export type QuizAnswerLockInputs = {
  isVerified?: boolean;
  isLocked?: boolean;
  isExpired?: boolean;
};

export function isQuizAnswerLocked(
  state: QuizAnswerLockInputs | undefined | null,
): boolean {
  if (!state) return false;
  return Boolean(state.isVerified || state.isLocked || state.isExpired);
}

export function shouldShowQuizAnswerCorrection({
  isVerified,
  showAnswerImmediately,
}: {
  isVerified?: boolean;
  showAnswerImmediately?: boolean;
}): boolean {
  return Boolean(isVerified && showAnswerImmediately);
}
