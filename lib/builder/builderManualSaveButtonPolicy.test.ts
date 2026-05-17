import { describe, expect, it } from "vitest";
import {
  isActivePrimarySaveDisabled,
  isCreateQuizButtonDisabledForNoQuestionsAndClean,
  isDraftServerManualSaveActionDisabled,
  isDraftServerManualSaveBusy,
} from "@/lib/builder/builderManualSaveButtonPolicy";

describe("isDraftServerManualSaveBusy", () => {
  it("is true when saving manually", () => {
    expect(
      isDraftServerManualSaveBusy({
        isSaving: true,
        isFinalizingDraft: false,
        builderSaveStatusKind: "server_pending",
        serverSaveUiPhase: "idle",
      }),
    ).toBe(true);
  });

  it("is true when finalizing", () => {
    expect(
      isDraftServerManualSaveBusy({
        isSaving: false,
        isFinalizingDraft: true,
        builderSaveStatusKind: "server_pending",
        serverSaveUiPhase: "idle",
      }),
    ).toBe(true);
  });

  it("is true during server_saving kind", () => {
    expect(
      isDraftServerManualSaveBusy({
        isSaving: false,
        isFinalizingDraft: false,
        builderSaveStatusKind: "server_saving",
        serverSaveUiPhase: "idle",
      }),
    ).toBe(true);
  });

  it("is true during autosaving phase", () => {
    expect(
      isDraftServerManualSaveBusy({
        isSaving: false,
        isFinalizingDraft: false,
        builderSaveStatusKind: "server_idle",
        serverSaveUiPhase: "autosaving",
      }),
    ).toBe(true);
  });

  it("is false for server_pending without saving or autosave in flight", () => {
    expect(
      isDraftServerManualSaveBusy({
        isSaving: false,
        isFinalizingDraft: false,
        builderSaveStatusKind: "server_pending",
        serverSaveUiPhase: "idle",
      }),
    ).toBe(false);
  });
});

describe("isDraftServerManualSaveActionDisabled", () => {
  it("disables when clean", () => {
    expect(
      isDraftServerManualSaveActionDisabled({
        isDirtyVersusBaseline: false,
        isSaving: false,
        isFinalizingDraft: false,
        builderSaveStatusKind: "server_idle",
        serverSaveUiPhase: "idle",
      }),
    ).toBe(true);
  });

  it("enables when dirty and server_pending", () => {
    expect(
      isDraftServerManualSaveActionDisabled({
        isDirtyVersusBaseline: true,
        isSaving: false,
        isFinalizingDraft: false,
        builderSaveStatusKind: "server_pending",
        serverSaveUiPhase: "idle",
      }),
    ).toBe(false);
  });

  it("disables while autosaving", () => {
    expect(
      isDraftServerManualSaveActionDisabled({
        isDirtyVersusBaseline: true,
        isSaving: false,
        isFinalizingDraft: false,
        builderSaveStatusKind: "server_saving",
        serverSaveUiPhase: "idle",
      }),
    ).toBe(true);
  });

  it("enables on server_error even when dirty", () => {
    expect(
      isDraftServerManualSaveActionDisabled({
        isDirtyVersusBaseline: true,
        isSaving: false,
        isFinalizingDraft: false,
        builderSaveStatusKind: "server_error",
        serverSaveUiPhase: "autosaveError",
      }),
    ).toBe(false);
  });
});

describe("isActivePrimarySaveDisabled", () => {
  it("disables when ACTIVE and clean", () => {
    expect(
      isActivePrimarySaveDisabled({
        serverQuizStatus: "ACTIVE",
        isDirtyVersusBaseline: false,
        isSaving: false,
        isFinalizingDraft: false,
      }),
    ).toBe(true);
  });

  it("enables when ACTIVE and dirty", () => {
    expect(
      isActivePrimarySaveDisabled({
        serverQuizStatus: "ACTIVE",
        isDirtyVersusBaseline: true,
        isSaving: false,
        isFinalizingDraft: false,
      }),
    ).toBe(false);
  });

  it("disables when ACTIVE and dirty but saving", () => {
    expect(
      isActivePrimarySaveDisabled({
        serverQuizStatus: "ACTIVE",
        isDirtyVersusBaseline: true,
        isSaving: true,
        isFinalizingDraft: false,
      }),
    ).toBe(true);
  });

  it("does not force-disable for DRAFT (caller uses other rules)", () => {
    expect(
      isActivePrimarySaveDisabled({
        serverQuizStatus: "DRAFT",
        isDirtyVersusBaseline: false,
        isSaving: false,
        isFinalizingDraft: false,
      }),
    ).toBe(false);
  });
});

describe("isCreateQuizButtonDisabledForNoQuestionsAndClean", () => {
  it("disables only when 0 questions and clean", () => {
    expect(
      isCreateQuizButtonDisabledForNoQuestionsAndClean({
        quizQuestionCount: 0,
        isDirtyVersusBaseline: false,
      }),
    ).toBe(true);
  });

  it("enables 0 questions when dirty (manual save allowed if validation passes)", () => {
    expect(
      isCreateQuizButtonDisabledForNoQuestionsAndClean({
        quizQuestionCount: 0,
        isDirtyVersusBaseline: true,
      }),
    ).toBe(false);
  });
});
