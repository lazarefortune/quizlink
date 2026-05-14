import type { QuizBuilder } from "@/types/quiz-builder";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";
import { validateBuilderTimeLimit, validateQuiz } from "@/lib/quiz-validation";
import type { BuilderTimeLimitUi } from "@/lib/time-limit-seconds";

export const SERVER_AUTOSAVE_DEBOUNCE_MS = 5_000;

export type ServerAutosaveGateReason =
  | "no_server_quiz_id"
  | "not_draft"
  | "baseline_missing"
  | "clean"
  | "no_questions"
  | "validation_errors"
  | "payload_over_autosave_limit";

export type ServerAutosaveGate =
  | { proceed: true }
  | { proceed: false; reason: ServerAutosaveGateReason };

export function mergeBuilderSaveValidationErrors(
  quiz: QuizBuilder,
  timeLimitUi: BuilderTimeLimitUi,
) {
  const timeLimitError = validateBuilderTimeLimit(timeLimitUi);
  const errors = validateQuiz(quiz);
  return timeLimitError ? [...errors, timeLimitError] : errors;
}

export function evaluateServerAutosaveGate(input: {
  savedQuizId: string | null;
  quizLifecycleStatus: QuizLifecycleStatus | null;
  baselineSnapshot: string | null;
  currentSnapshot: string;
  quizForValidation: QuizBuilder;
  timeLimitUi: BuilderTimeLimitUi;
  estimatedPayloadBytes: number;
  autosavePayloadMaxBytes: number;
}): ServerAutosaveGate {
  if (!input.savedQuizId) {
    return { proceed: false, reason: "no_server_quiz_id" };
  }
  if (input.quizLifecycleStatus !== "DRAFT") {
    return { proceed: false, reason: "not_draft" };
  }
  if (input.baselineSnapshot === null) {
    return { proceed: false, reason: "baseline_missing" };
  }
  if (input.currentSnapshot === input.baselineSnapshot) {
    return { proceed: false, reason: "clean" };
  }
  if (input.quizForValidation.questions.length === 0) {
    return { proceed: false, reason: "no_questions" };
  }
  const merged = mergeBuilderSaveValidationErrors(input.quizForValidation, input.timeLimitUi);
  if (merged.length > 0) {
    return { proceed: false, reason: "validation_errors" };
  }
  if (input.estimatedPayloadBytes >= input.autosavePayloadMaxBytes) {
    return { proceed: false, reason: "payload_over_autosave_limit" };
  }
  return { proceed: true };
}
