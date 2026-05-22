import {
  validateBuilderTimeLimit,
  validateQuiz,
  type ValidationError,
} from "@/lib/quiz-validation";
import {
  buildQuizSettingsWithResolvedTimeLimit,
  type BuilderTimeLimitUi,
} from "@/lib/time-limit-seconds";
import type { QuizBuilder } from "@/types/quiz-builder";

export function collectBuilderSaveValidationErrors(
  quiz: QuizBuilder,
  timeLimitUi: BuilderTimeLimitUi,
): ValidationError[] {
  const timeLimitError = validateBuilderTimeLimit(timeLimitUi);
  const errors = validateQuiz(quiz);
  return timeLimitError ? [...errors, timeLimitError] : errors;
}

export function buildQuizToSaveFromBuilderState(
  quiz: QuizBuilder,
  timeLimitUi: BuilderTimeLimitUi,
): QuizBuilder {
  return {
    ...quiz,
    settings: buildQuizSettingsWithResolvedTimeLimit(quiz.settings, timeLimitUi),
  };
}
