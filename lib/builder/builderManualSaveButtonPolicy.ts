import type {
  BuilderSaveStatusDisplayKind,
  BuilderServerSaveUiPhase,
} from "@/lib/builder/builderSaveStatusDisplay";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

export function isDraftServerManualSaveBusy(input: {
  isSaving: boolean;
  isFinalizingDraft: boolean;
  builderSaveStatusKind: BuilderSaveStatusDisplayKind;
  serverSaveUiPhase: BuilderServerSaveUiPhase;
}): boolean {
  if (input.isSaving || input.isFinalizingDraft) {
    return true;
  }
  if (
    input.builderSaveStatusKind === "server_saving" ||
    input.serverSaveUiPhase === "autosaving"
  ) {
    return true;
  }
  return false;
}

/**
 * DRAFT + savedQuizId outline "Enregistrer": enabled when dirty and not busy
 * (includes server_pending: autosave debounce scheduled only).
 */
export function isDraftServerManualSaveActionDisabled(input: {
  isDirtyVersusBaseline: boolean;
  isSaving: boolean;
  isFinalizingDraft: boolean;
  builderSaveStatusKind: BuilderSaveStatusDisplayKind;
  serverSaveUiPhase: BuilderServerSaveUiPhase;
}): boolean {
  if (!input.isDirtyVersusBaseline) {
    return true;
  }
  if (input.builderSaveStatusKind === "server_error") {
    return false;
  }
  return isDraftServerManualSaveBusy({
    isSaving: input.isSaving,
    isFinalizingDraft: input.isFinalizingDraft,
    builderSaveStatusKind: input.builderSaveStatusKind,
    serverSaveUiPhase: input.serverSaveUiPhase,
  });
}

export function isActivePrimarySaveDisabled(input: {
  serverQuizStatus: QuizLifecycleStatus | null;
  isDirtyVersusBaseline: boolean;
  isSaving: boolean;
  isFinalizingDraft: boolean;
}): boolean {
  if (input.serverQuizStatus !== "ACTIVE") {
    return false;
  }
  if (input.isSaving || input.isFinalizingDraft) {
    return true;
  }
  if (!input.isDirtyVersusBaseline) {
    return true;
  }
  return false;
}

/**
 * Shown as disabled "Créer le quiz" / first save when there are no questions
 * and nothing diverged from baseline yet.
 */
export function isCreateQuizButtonDisabledForNoQuestionsAndClean(input: {
  quizQuestionCount: number;
  isDirtyVersusBaseline: boolean;
}): boolean {
  return input.quizQuestionCount === 0 && !input.isDirtyVersusBaseline;
}
