import { describe, expect, it } from "vitest";

import {
  BUILDER_LOCAL_DRAFT_MAX_AGE_MS,
  type BuilderDraftIndexEntry,
} from "@/lib/builder/builderLocalDraft";
import {
  getFirstVisibleBuilderDraftIndexEntry,
  shouldShowBuilderLocalDraftOnDashboard,
} from "@/lib/builder/filterLocalDraftForDashboard";

function entry(scope: string, savedAt?: string, updatedAt?: string): BuilderDraftIndexEntry {
  const at = savedAt ?? new Date().toISOString();
  return {
    scope,
    draftKey: `k:${scope}`,
    quizId: scope === "new" ? null : scope,
    quizName: "Q",
    questionCount: 1,
    savedAt: at,
    updatedAt: updatedAt ?? at,
    targetRoute: scope === "new" ? "/builder" : `/builder/${scope}`,
  };
}

describe("shouldShowBuilderLocalDraftOnDashboard", () => {
  it("keeps scope new visible even when that id is not in server drafts", () => {
    expect(shouldShowBuilderLocalDraftOnDashboard(entry("new"), new Set(["cldraft1"]))).toBe(
      true,
    );
  });

  it("hides local entry when scope matches a server DRAFT id", () => {
    expect(
      shouldShowBuilderLocalDraftOnDashboard(entry("cldraft1"), new Set(["cldraft1"])),
    ).toBe(false);
  });

  it("shows local entry when scope is a quiz id not in server DRAFT set", () => {
    expect(
      shouldShowBuilderLocalDraftOnDashboard(entry("clactive1"), new Set(["cldraft1"])),
    ).toBe(true);
  });

  it("hides expired scope new entries", () => {
    const staleIso = new Date(Date.now() - BUILDER_LOCAL_DRAFT_MAX_AGE_MS - 60_000).toISOString();
    expect(shouldShowBuilderLocalDraftOnDashboard(entry("new", staleIso), new Set(), Date.now())).toBe(
      false,
    );
  });

  it("hides expired quiz-scoped entries even when not a server DRAFT", () => {
    const staleIso = new Date(Date.now() - BUILDER_LOCAL_DRAFT_MAX_AGE_MS - 60_000).toISOString();
    expect(
      shouldShowBuilderLocalDraftOnDashboard(entry("clactive1", staleIso), new Set(), Date.now()),
    ).toBe(false);
  });
});

describe("getFirstVisibleBuilderDraftIndexEntry", () => {
  it("returns null when index is empty", () => {
    expect(getFirstVisibleBuilderDraftIndexEntry("user-with-no-drafts", [])).toBe(null);
  });
});
