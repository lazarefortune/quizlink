/**
 * Mobile builder: quiz options collapsible should be open when there are no questions
 * (user sets title/settings first) and close once at least one question exists
 * (focus on the question list). Re-open if all questions are removed.
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
