import type {
  BuilderSaveStatusDisplayKind,
  BuilderServerSaveUiPhase,
} from "@/lib/builder/builderSaveStatusDisplay";

export type BuilderDraftSaveSystemStatus =
  | "draft_saved"
  | "pending"
  | "changes_to_save"
  | "dirty"
  | "saving"
  | "error"
  | "hidden";

/**
 * System status line for DRAFT + server id (separate from the "Enregistrer" action button).
 */
export function resolveBuilderDraftSaveSystemStatus(input: {
  isDirtyVersusBaseline: boolean;
  builderSaveStatusKind: BuilderSaveStatusDisplayKind;
  serverSaveUiPhase: BuilderServerSaveUiPhase;
  isSaving: boolean;
  effectiveAutoSaveEnabled: boolean;
}): BuilderDraftSaveSystemStatus {
  if (!input.isDirtyVersusBaseline) {
    return "draft_saved";
  }
  if (
    input.builderSaveStatusKind === "server_error" ||
    input.serverSaveUiPhase === "autosaveError"
  ) {
    return "error";
  }
  if (
    input.isSaving ||
    input.builderSaveStatusKind === "server_saving" ||
    input.serverSaveUiPhase === "autosaving"
  ) {
    return "saving";
  }
  if (!input.effectiveAutoSaveEnabled) {
    return "changes_to_save";
  }
  if (input.builderSaveStatusKind === "server_pending") {
    return "pending";
  }
  return "dirty";
}
