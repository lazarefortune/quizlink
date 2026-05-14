import { describe, expect, it } from "vitest";
import {
  BUILDER_SAVE_STATUS_RECENT_MS,
  resolveBuilderSaveStatusDisplay,
} from "@/lib/builder/builderSaveStatusDisplay";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

const base = (status: QuizLifecycleStatus | null = "DRAFT") =>
  ({
    phase: "idle" as const,
    savedQuizId: "clid",
    quizLifecycleStatus: status,
    isDirtyVersusBaseline: false,
    quizQuestionCount: 1,
    gateProceedsForServerAutosave: true,
    isManualSaving: false,
    lastServerAutosaveSuccessAt: null as number | null,
    nowMs: 1_000_000,
  }) satisfies Parameters<typeof resolveBuilderSaveStatusDisplay>[0];

describe("resolveBuilderSaveStatusDisplay", () => {
  it("prioritises error phase", () => {
    expect(
      resolveBuilderSaveStatusDisplay({
        ...base(),
        phase: "autosaveError",
        isDirtyVersusBaseline: true,
      }),
    ).toBe("server_error");
  });

  it("prioritises autosaving phase", () => {
    expect(
      resolveBuilderSaveStatusDisplay({
        ...base(),
        phase: "autosaving",
      }),
    ).toBe("server_saving");
  });

  it("shows flash label during autosaveSaved phase", () => {
    expect(
      resolveBuilderSaveStatusDisplay({
        ...base(),
        phase: "autosaveSaved",
      }),
    ).toBe("server_saved_flash");
  });

  it("shows recent save when clean and within window", () => {
    const t0 = 1_000_000;
    expect(
      resolveBuilderSaveStatusDisplay({
        ...base(),
        lastServerAutosaveSuccessAt: t0 - 5_000,
        nowMs: t0,
      }),
    ).toBe("server_saved_recent");
  });

  it("hides recent save banner when clean ACTIVE is within recent window", () => {
    const t0 = 1_000_000;
    expect(
      resolveBuilderSaveStatusDisplay({
        ...base("ACTIVE"),
        lastServerAutosaveSuccessAt: t0 - 5_000,
        nowMs: t0,
      }),
    ).toBe("hidden");
  });

  it("shows idle when recent window elapsed (DRAFT)", () => {
    const t0 = 1_000_000;
    expect(
      resolveBuilderSaveStatusDisplay({
        ...base("DRAFT"),
        lastServerAutosaveSuccessAt: t0 - BUILDER_SAVE_STATUS_RECENT_MS - 1,
        nowMs: t0,
      }),
    ).toBe("server_idle");
  });

  it("hides manual idle when clean ACTIVE and recent window elapsed", () => {
    const t0 = 1_000_000;
    expect(
      resolveBuilderSaveStatusDisplay({
        ...base("ACTIVE"),
        lastServerAutosaveSuccessAt: t0 - BUILDER_SAVE_STATUS_RECENT_MS - 1,
        nowMs: t0,
      }),
    ).toBe("hidden");
  });

  it("shows local draft for new quiz dirty with questions", () => {
    expect(
      resolveBuilderSaveStatusDisplay({
        ...base(),
        savedQuizId: null,
        isDirtyVersusBaseline: true,
        quizQuestionCount: 2,
      }),
    ).toBe("local_draft");
  });

  it("does not show local draft without questions", () => {
    expect(
      resolveBuilderSaveStatusDisplay({
        ...base(),
        savedQuizId: null,
        isDirtyVersusBaseline: true,
        quizQuestionCount: 0,
      }),
    ).toBe("hidden");
  });

  it("shows pending when server quiz dirty gate ok and not manual saving (DRAFT)", () => {
    expect(
      resolveBuilderSaveStatusDisplay({
        ...base("DRAFT"),
        isDirtyVersusBaseline: true,
        gateProceedsForServerAutosave: true,
        isManualSaving: false,
      }),
    ).toBe("server_pending");
  });

  it("hides pending during manual save", () => {
    expect(
      resolveBuilderSaveStatusDisplay({
        ...base("DRAFT"),
        isDirtyVersusBaseline: true,
        gateProceedsForServerAutosave: true,
        isManualSaving: true,
      }),
    ).toBe("hidden");
  });

  it("hides pending when gate does not proceed on DRAFT (e.g. validation)", () => {
    expect(
      resolveBuilderSaveStatusDisplay({
        ...base("DRAFT"),
        isDirtyVersusBaseline: true,
        gateProceedsForServerAutosave: false,
      }),
    ).toBe("hidden");
  });

  it("hides manual save reminder when ACTIVE dirty and server autosave is off", () => {
    expect(
      resolveBuilderSaveStatusDisplay({
        ...base("ACTIVE"),
        isDirtyVersusBaseline: true,
        gateProceedsForServerAutosave: false,
        isManualSaving: false,
      }),
    ).toBe("hidden");
  });

  it("shows archived readonly when quiz is archived", () => {
    expect(
      resolveBuilderSaveStatusDisplay({
        ...base("ARCHIVED"),
        isDirtyVersusBaseline: true,
        gateProceedsForServerAutosave: false,
      }),
    ).toBe("archived_readonly");
  });
});
