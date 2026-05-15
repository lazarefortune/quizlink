/**
 * Mobile builder: options collapsible is open when there are no questions (name + settings first),
 * closes when the user adds the first question, and re-opens if all questions are removed again.
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
