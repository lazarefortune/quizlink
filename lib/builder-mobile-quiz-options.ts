/**
 * Mobile / sheet UX: close quiz settings when the first question is added (questions stay
 * primary). Skip auto-close when adding the first question would hide quiz-options validation
 * errors. Does not re-open settings when all questions are removed — the empty-state panel
 * is shown instead.
 */
export function resolveMobileQuizOptionsOpenAfterQuestionCountChange(
  previousQuestionCount: number,
  nextQuestionCount: number,
): boolean | null {
  if (nextQuestionCount > 0 && previousQuestionCount === 0) {
    return false;
  }
  return null;
}
