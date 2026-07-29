import { isUntitledQuizName } from "@/lib/quiz/quizNameValidation";
import type { Question } from "@/types/quiz-builder";

export type DesktopBuilderSelection = { view: "settings" } | { view: "questions" };

export function isQuizUntitledForDesktopSelection(quizName: string): boolean {
  return isUntitledQuizName(quizName);
}

export function resolveInitialDesktopBuilderSelection(input: {
  quizName: string;
  questions: Question[];
}): DesktopBuilderSelection {
  if (input.questions.length === 0) {
    return { view: "settings" };
  }
  return { view: "questions" };
}

export function resolveInitialDesktopActiveQuestionId(questions: Question[]): string | null {
  return questions.length > 0 ? questions[0].id : null;
}

export function resolveDesktopBuilderSelectionAfterQuestionDelete(
  current: DesktopBuilderSelection,
  remainingQuestions: Question[],
): DesktopBuilderSelection {
  if (current.view === "settings") {
    return current;
  }
  if (remainingQuestions.length === 0) {
    return { view: "settings" };
  }
  return { view: "questions" };
}

export function resolveActiveQuestionIdAfterQuestionDelete(
  activeQuestionId: string | null,
  deletedQuestionId: string,
  previousQuestions: Question[],
  remainingQuestions: Question[],
): string | null {
  if (activeQuestionId !== deletedQuestionId) {
    return activeQuestionId;
  }
  if (remainingQuestions.length === 0) {
    return null;
  }
  const deletedIndex = previousQuestions.findIndex((question) => question.id === deletedQuestionId);
  const fallbackIndex = Math.min(
    Math.max(deletedIndex, 0),
    remainingQuestions.length - 1,
  );
  return remainingQuestions[fallbackIndex].id;
}
