import {
  loadBuilderDraftIndex,
  isBuilderDraftIndexEntryExpired,
  type BuilderDraftIndexEntry,
} from "@/lib/builder/builderLocalDraft";

/**
 * Hides dashboard “local recovery” cards when the same quiz already exists as a server DRAFT
 * (server is source of truth; recovery is offered inside the builder), or when the entry is
 * past the local recovery retention window.
 */
export function shouldShowBuilderLocalDraftOnDashboard(
  entry: BuilderDraftIndexEntry,
  serverDraftQuizIdSet: ReadonlySet<string>,
  nowMs: number = Date.now(),
): boolean {
  if (isBuilderDraftIndexEntryExpired(entry, nowMs)) {
    return false;
  }
  if (entry.scope === "new") {
    return true;
  }
  return !serverDraftQuizIdSet.has(entry.scope);
}

export function getFirstVisibleBuilderDraftIndexEntry(
  userId: string,
  serverDraftQuizIds: readonly string[],
): BuilderDraftIndexEntry | null {
  const set = new Set(serverDraftQuizIds);
  for (const entry of loadBuilderDraftIndex(userId)) {
    if (shouldShowBuilderLocalDraftOnDashboard(entry, set)) {
      return entry;
    }
  }
  return null;
}
