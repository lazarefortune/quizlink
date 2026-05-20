import { isQuizAnswerLocked, type QuizAnswerLockInputs } from "./quizAnswerLock";

export function shouldShowBackToCurrentQuestion(
  viewedQuestionId: string | null | undefined,
  activeTimedQuestionId: string | null | undefined,
): boolean {
  if (!viewedQuestionId || !activeTimedQuestionId) {
    return false;
  }
  return viewedQuestionId !== activeTimedQuestionId;
}

export function findQuestionIndexById(
  questions: ReadonlyArray<{ id: string }>,
  questionId: string | null | undefined,
): number | null {
  if (!questionId) {
    return null;
  }
  const index = questions.findIndex((question) => question.id === questionId);
  return index >= 0 ? index : null;
}

export function findNextUnlockedQuestionId(
  questions: ReadonlyArray<{ id: string }>,
  answersByQuestionId: Readonly<Record<string, QuizAnswerLockInputs | undefined>>,
  afterQuestionId?: string | null,
): string | null {
  const startIndex =
    afterQuestionId === undefined || afterQuestionId === null
      ? 0
      : (findQuestionIndexById(questions, afterQuestionId) ?? -1) + 1;

  for (let index = Math.max(0, startIndex); index < questions.length; index += 1) {
    const question = questions[index];
    if (!isQuizAnswerLocked(answersByQuestionId[question.id])) {
      return question.id;
    }
  }

  return null;
}

export function formatQuizTimeLeftDesktopLabel(
  timeLeftLabel: string,
  seconds: number,
): string {
  return `${timeLeftLabel} : ${seconds}s`;
}
