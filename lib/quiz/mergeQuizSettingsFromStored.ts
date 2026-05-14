import { DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS } from "@/lib/builder/defaultManualQuizSettings";
import type { QuizSettings } from "@/types/quiz-builder";

function readTimeLimitFromStored(raw: Record<string, unknown>): number | null {
  const v = raw.timeLimitPerQuestion;
  if (v === null) {
    return null;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  return DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS.timeLimitPerQuestion;
}

/**
 * Normalizes JSON quiz settings from the database into a full `QuizSettings` for the builder.
 */
export function mergeQuizSettingsFromStored(stored: unknown): QuizSettings {
  const raw =
    typeof stored === "object" && stored !== null
      ? (stored as Record<string, unknown>)
      : {};

  const randomizeQuestions = Boolean(raw.randomizeQuestions);
  const randomizeOptions =
    typeof raw.randomizeOptions === "boolean"
      ? raw.randomizeOptions
      : randomizeQuestions;

  return {
    showAnswerImmediately:
      typeof raw.showAnswerImmediately === "boolean"
        ? raw.showAnswerImmediately
        : DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS.showAnswerImmediately,
    randomizeQuestions,
    randomizeOptions,
    timeLimitPerQuestion: readTimeLimitFromStored(raw),
  };
}
