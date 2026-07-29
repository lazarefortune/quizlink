import {
  collectBuilderFullSaveValidationErrors,
  canProceedWithBuilderSave,
} from "@/lib/builder/builderSplitSave";
import {
  buildQuizSettingsWithResolvedTimeLimit,
  type BuilderTimeLimitUi,
} from "@/lib/time-limit-seconds";
import { normalizeQuizName } from "@/lib/quiz/quizNameValidation";
import type { QuizBuilder } from "@/types/quiz-builder";

export {
  collectBuilderMetadataValidationErrors,
  collectBuilderQuestionsValidationErrors,
} from "@/lib/builder/builderSplitSave";

export function collectBuilderSaveValidationErrors(
  quiz: QuizBuilder,
  timeLimitUi: BuilderTimeLimitUi,
) {
  return collectBuilderFullSaveValidationErrors(quiz, timeLimitUi);
}

export {
  canProceedWithBuilderSave,
  mergeBaselineAfterPartialSave,
} from "@/lib/builder/builderSplitSave";

export function buildQuizToSaveFromBuilderState(
  quiz: QuizBuilder,
  timeLimitUi: BuilderTimeLimitUi,
): QuizBuilder {
  return {
    ...quiz,
    name: normalizeQuizName(quiz.name),
    settings: buildQuizSettingsWithResolvedTimeLimit(quiz.settings, timeLimitUi),
  };
}
