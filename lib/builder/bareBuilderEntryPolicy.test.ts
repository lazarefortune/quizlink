import { describe, expect, it } from "vitest";

import { shouldAllowBareBuilderEntry } from "./bareBuilderEntryPolicy";

describe("shouldAllowBareBuilderEntry", () => {
  const deny = {
    hasQuizIdSearchParam: false,
    wantsRestoreDraft: false,
    hasSessionTransferQuizInStorage: false,
    hasPersistedNewScopeLocalDraft: false,
  };

  it("returns false when no reason to keep bare /builder", () => {
    expect(shouldAllowBareBuilderEntry(deny)).toBe(false);
  });

  it("returns true when ?quizId= is present", () => {
    expect(shouldAllowBareBuilderEntry({ ...deny, hasQuizIdSearchParam: true })).toBe(true);
  });

  it("returns true when restoreDraft is requested", () => {
    expect(shouldAllowBareBuilderEntry({ ...deny, wantsRestoreDraft: true })).toBe(true);
  });

  it("returns true when session transfer payload exists", () => {
    expect(
      shouldAllowBareBuilderEntry({ ...deny, hasSessionTransferQuizInStorage: true }),
    ).toBe(true);
  });

  it("returns true when a persisted new-scope local draft exists", () => {
    expect(
      shouldAllowBareBuilderEntry({ ...deny, hasPersistedNewScopeLocalDraft: true }),
    ).toBe(true);
  });
});
