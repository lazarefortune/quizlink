import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

export type BuilderServerSaveUiPhase =
  | "idle"
  | "autosaving"
  | "autosaveSaved"
  | "autosaveError";

export type BuilderSaveStatusDisplayKind =
  | "hidden"
  | "local_draft"
  | "server_pending"
  | "server_saving"
  | "server_saved_flash"
  | "server_saved_recent"
  | "server_idle"
  | "server_idle_manual"
  | "manual_save_active"
  | "archived_readonly"
  | "server_error";

export const BUILDER_SAVE_STATUS_RECENT_MS = 45_000;

export type BuilderSaveStatusDisplayInput = {
  phase: BuilderServerSaveUiPhase;
  savedQuizId: string | null;
  quizLifecycleStatus: QuizLifecycleStatus | null;
  isDirtyVersusBaseline: boolean;
  quizQuestionCount: number;
  gateProceedsForServerAutosave: boolean;
  isManualSaving: boolean;
  lastServerAutosaveSuccessAt: number | null;
  nowMs: number;
};

function suppressActiveIdleStatusBar(
  status: QuizLifecycleStatus | null,
  kind: BuilderSaveStatusDisplayKind,
): BuilderSaveStatusDisplayKind {
  if (status !== "ACTIVE") {
    return kind;
  }
  if (
    kind === "server_idle_manual" ||
    kind === "manual_save_active" ||
    kind === "server_saved_recent" ||
    kind === "server_saved_flash"
  ) {
    return "hidden";
  }
  return kind;
}

export function resolveBuilderSaveStatusDisplay(
  input: BuilderSaveStatusDisplayInput,
): BuilderSaveStatusDisplayKind {
  if (input.phase === "autosaveError") {
    return suppressActiveIdleStatusBar(input.quizLifecycleStatus, "server_error");
  }
  if (input.phase === "autosaving") {
    return suppressActiveIdleStatusBar(input.quizLifecycleStatus, "server_saving");
  }
  if (input.phase === "autosaveSaved") {
    return suppressActiveIdleStatusBar(input.quizLifecycleStatus, "server_saved_flash");
  }

  if (input.quizLifecycleStatus === "ARCHIVED" && input.savedQuizId !== null) {
    return "archived_readonly";
  }

  const hasRecentServerSave =
    input.savedQuizId !== null &&
    !input.isDirtyVersusBaseline &&
    input.lastServerAutosaveSuccessAt !== null &&
    input.nowMs - input.lastServerAutosaveSuccessAt < BUILDER_SAVE_STATUS_RECENT_MS;

  if (hasRecentServerSave) {
    return suppressActiveIdleStatusBar(input.quizLifecycleStatus, "server_saved_recent");
  }

  if (
    input.savedQuizId === null &&
    input.isDirtyVersusBaseline &&
    input.quizQuestionCount > 0
  ) {
    return suppressActiveIdleStatusBar(input.quizLifecycleStatus, "local_draft");
  }

  if (
    input.savedQuizId !== null &&
    input.isDirtyVersusBaseline &&
    input.quizLifecycleStatus === "ACTIVE" &&
    !input.gateProceedsForServerAutosave &&
    !input.isManualSaving
  ) {
    return suppressActiveIdleStatusBar(input.quizLifecycleStatus, "manual_save_active");
  }

  if (
    input.savedQuizId !== null &&
    input.isDirtyVersusBaseline &&
    input.gateProceedsForServerAutosave &&
    !input.isManualSaving
  ) {
    return suppressActiveIdleStatusBar(input.quizLifecycleStatus, "server_pending");
  }

  if (input.savedQuizId !== null && !input.isDirtyVersusBaseline) {
    if (input.quizLifecycleStatus === "ACTIVE") {
      return suppressActiveIdleStatusBar(input.quizLifecycleStatus, "server_idle_manual");
    }
    return suppressActiveIdleStatusBar(input.quizLifecycleStatus, "server_idle");
  }

  return "hidden";
}
