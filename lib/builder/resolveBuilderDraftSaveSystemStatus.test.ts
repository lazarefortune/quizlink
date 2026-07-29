import { describe, expect, it } from "vitest";
import { resolveBuilderDraftSaveSystemStatus } from "@/lib/builder/resolveBuilderDraftSaveSystemStatus";

describe("resolveBuilderDraftSaveSystemStatus", () => {
  it("returns draft_saved when clean", () => {
    expect(
      resolveBuilderDraftSaveSystemStatus({
        isDirtyVersusBaseline: false,
        builderSaveStatusKind: "server_idle",
        serverSaveUiPhase: "idle",
        isSaving: false,
        effectiveAutoSaveEnabled: true,
      }),
    ).toBe("draft_saved");
  });

  it("returns draft_saved when clean and server autosave is disabled", () => {
    expect(
      resolveBuilderDraftSaveSystemStatus({
        isDirtyVersusBaseline: false,
        builderSaveStatusKind: "server_idle",
        serverSaveUiPhase: "idle",
        isSaving: false,
        effectiveAutoSaveEnabled: false,
      }),
    ).toBe("draft_saved");
  });

  it("returns pending when dirty and server_pending with autosave on", () => {
    expect(
      resolveBuilderDraftSaveSystemStatus({
        isDirtyVersusBaseline: true,
        builderSaveStatusKind: "server_pending",
        serverSaveUiPhase: "idle",
        isSaving: false,
        effectiveAutoSaveEnabled: true,
      }),
    ).toBe("pending");
  });

  it("returns changes_to_save when dirty and autosave off even if gate would pending", () => {
    expect(
      resolveBuilderDraftSaveSystemStatus({
        isDirtyVersusBaseline: true,
        builderSaveStatusKind: "server_pending",
        serverSaveUiPhase: "idle",
        isSaving: false,
        effectiveAutoSaveEnabled: false,
      }),
    ).toBe("changes_to_save");
  });

  it("returns saving during autosaving phase", () => {
    expect(
      resolveBuilderDraftSaveSystemStatus({
        isDirtyVersusBaseline: true,
        builderSaveStatusKind: "server_idle",
        serverSaveUiPhase: "autosaving",
        isSaving: false,
        effectiveAutoSaveEnabled: true,
      }),
    ).toBe("saving");
  });

  it("returns saving during manual save", () => {
    expect(
      resolveBuilderDraftSaveSystemStatus({
        isDirtyVersusBaseline: true,
        builderSaveStatusKind: "server_pending",
        serverSaveUiPhase: "idle",
        isSaving: true,
        effectiveAutoSaveEnabled: true,
      }),
    ).toBe("saving");
  });

  it("returns error for server_error kind", () => {
    expect(
      resolveBuilderDraftSaveSystemStatus({
        isDirtyVersusBaseline: true,
        builderSaveStatusKind: "server_error",
        serverSaveUiPhase: "autosaveError",
        isSaving: false,
        effectiveAutoSaveEnabled: true,
      }),
    ).toBe("error");
  });

  it("returns dirty when dirty but not pending/saving/error and autosave on", () => {
    expect(
      resolveBuilderDraftSaveSystemStatus({
        isDirtyVersusBaseline: true,
        builderSaveStatusKind: "hidden",
        serverSaveUiPhase: "idle",
        isSaving: false,
        effectiveAutoSaveEnabled: true,
      }),
    ).toBe("dirty");
  });
});
