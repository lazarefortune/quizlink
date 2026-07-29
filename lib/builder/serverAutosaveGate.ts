import type { QuizBuilder } from "@/types/quiz-builder";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";
import {
  canProceedWithSplitSave,
  resolveBuilderSplitSavePlan,
} from "@/lib/builder/builderSplitSave";
import { validateQuizWithTimeLimitUi } from "@/lib/quiz-validation";
import type { BuilderTimeLimitUi } from "@/lib/time-limit-seconds";
import { resolveEffectiveAutoSaveEnabled } from "@/lib/builder/resolveEffectiveAutoSaveEnabled";

export const SERVER_AUTOSAVE_DEBOUNCE_MS = 5_000;

export type ServerAutosaveGateReason =
  | "no_server_quiz_id"
  | "not_draft"
  | "baseline_missing"
  | "clean"
  | "validation_errors"
  | "payload_over_autosave_limit"
  | "auto_save_disabled";

export type ServerAutosaveGate =
  | { proceed: true }
  | { proceed: false; reason: ServerAutosaveGateReason };

export function mergeBuilderSaveValidationErrors(
  quiz: QuizBuilder,
  timeLimitUi: BuilderTimeLimitUi,
) {
  return validateQuizWithTimeLimitUi(quiz, timeLimitUi);
}

/** Matches finalize-draft preconditions: at least one question and zero merged save/finalize validation errors. */
export function isBuilderQuizValidForFinalize(
  quiz: QuizBuilder,
  timeLimitUi: BuilderTimeLimitUi,
): boolean {
  if (quiz.questions.length === 0) {
    return false;
  }
  return mergeBuilderSaveValidationErrors(quiz, timeLimitUi).length === 0;
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
  if (!resolveEffectiveAutoSaveEnabled(input.quizForValidation.settings)) {
    return { proceed: false, reason: "auto_save_disabled" };
  }
  if (input.baselineSnapshot === null) {
    return { proceed: false, reason: "baseline_missing" };
  }
  if (input.currentSnapshot === input.baselineSnapshot) {
    return { proceed: false, reason: "clean" };
  }

  const plan = resolveBuilderSplitSavePlan({
    quiz: input.quizForValidation,
    timeLimitUi: input.timeLimitUi,
    baselineSnapshot: input.baselineSnapshot,
    currentSnapshot: input.currentSnapshot,
  });

  if (!plan.metadataDirty && !plan.questionsDirty) {
    return { proceed: false, reason: "clean" };
  }

  if (!canProceedWithSplitSave(plan)) {
    return { proceed: false, reason: "validation_errors" };
  }

  if (input.estimatedPayloadBytes >= input.autosavePayloadMaxBytes) {
    return { proceed: false, reason: "payload_over_autosave_limit" };
  }
  return { proceed: true };
}
