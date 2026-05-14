/**
 * When the user opens `/builder` without a path `quizId`, we normally redirect to
 * `/dashboard/create` so new work uses a server DRAFT. This predicate lists cases
 * where the legacy bare builder must still load (local draft, session transfer, etc.).
 */
export function shouldAllowBareBuilderEntry(args: {
  hasQuizIdSearchParam: boolean;
  wantsRestoreDraft: boolean;
  hasSessionTransferQuizInStorage: boolean;
  hasPersistedNewScopeLocalDraft: boolean;
}): boolean {
  return (
    args.hasQuizIdSearchParam ||
    args.wantsRestoreDraft ||
    args.hasSessionTransferQuizInStorage ||
    args.hasPersistedNewScopeLocalDraft
  );
}
