/**
 * Mobile / sheet UX: open quiz settings when there are no questions (title + options first),
 * close when the first question is added (questions stay primary), re-open when all questions are
 * removed. Skip auto-close when adding the first question would hide quiz-options validation errors.
 */
export function resolveMobileQuizOptionsOpenAfterQuestionCountChange(
  previousQuestionCount: number,
  nextQuestionCount: number,
): boolean | null {
  if (nextQuestionCount === 0 && previousQuestionCount > 0) {
    return true;
  }
  if (nextQuestionCount > 0 && previousQuestionCount === 0) {
    return false;
  }
  return null;
}
