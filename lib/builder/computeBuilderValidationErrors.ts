import {
  validateBuilderTimeLimit,
  validateQuiz,
  type ValidationError,
} from "@/lib/quiz-validation";
import type { BuilderTimeLimitUi } from "@/lib/time-limit-seconds";
import type { QuizBuilder } from "@/types/quiz-builder";

/**
 * Single source of truth for the builder's validation: merges question/name/settings
 * errors with the time-limit error. Pure, so it can be re-run safely on every
 * change in live validation mode.
 */
export function computeBuilderValidationErrors(
  quiz: QuizBuilder,
  timeLimitUi: BuilderTimeLimitUi,
): ValidationError[] {
  const errors = validateQuiz(quiz);
  const timeLimitError = validateBuilderTimeLimit(timeLimitUi);
  return timeLimitError ? [...errors, timeLimitError] : errors;
}
