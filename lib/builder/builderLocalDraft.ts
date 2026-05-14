import type { BuilderTimeLimitUi } from "@/lib/time-limit-seconds";
import type { QuizBuilder } from "@/types/quiz-builder";

import { computeQuizBuilderSnapshot } from "./quizBuilderSnapshot";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const BUILDER_LOCAL_DRAFT_FORMAT_VERSION = 1 as const;

export const BUILDER_DRAFT_INDEX_FORMAT_VERSION = 1 as const;

export type BuilderLocalDraftQuizScope = "new" | string;

export type BuilderDraftIndexEntry = {
  scope: string;
  draftKey: string;
  quizId: string | null;
  quizName: string;
  questionCount: number;
  savedAt: string;
  updatedAt: string;
  targetRoute: string;
};

export type BuilderDraftIndexFile = {
  formatVersion: typeof BUILDER_DRAFT_INDEX_FORMAT_VERSION;
  entries: BuilderDraftIndexEntry[];
};

export type BuilderLocalDraftPayload = {
  formatVersion: typeof BUILDER_LOCAL_DRAFT_FORMAT_VERSION;
  savedAt: string;
  sourceRoute: string;
  quiz: QuizBuilder;
  timeLimitUi: BuilderTimeLimitUi;
};

export function buildBuilderDraftKey(
  userId: string,
  quizIdOrNew: BuilderLocalDraftQuizScope,
): string {
  const scope = quizIdOrNew === "new" ? "new" : quizIdOrNew;
  return `quizsnap:builder-draft:v${BUILDER_LOCAL_DRAFT_FORMAT_VERSION}:${userId}:${scope}`;
}

export function buildBuilderDraftIndexKey(userId: string): string {
  return `quizsnap:builder-draft-index:v${BUILDER_DRAFT_INDEX_FORMAT_VERSION}:${userId}`;
}

export function buildBuilderDraftTargetRoute(scope: BuilderLocalDraftQuizScope): string {
  if (scope === "new") {
    return "/builder";
  }
  return `/builder/${scope}`;
}

export function buildBuilderDraftIndexEntry(args: {
  scope: BuilderLocalDraftQuizScope;
  draftKey: string;
  payload: BuilderLocalDraftPayload;
}): BuilderDraftIndexEntry {
  const scopeStr = args.scope === "new" ? "new" : args.scope;
  const savedAt = args.payload.savedAt;
  return {
    scope: scopeStr,
    draftKey: args.draftKey,
    quizId: scopeStr === "new" ? null : scopeStr,
    quizName: args.payload.quiz.name.trim(),
    questionCount: args.payload.quiz.questions.length,
    savedAt,
    updatedAt: savedAt,
    targetRoute: buildBuilderDraftTargetRoute(args.scope),
  };
}

export function normalizeAndPruneBuilderDraftIndexEntries(
  entries: BuilderDraftIndexEntry[],
  draftKeyExists: (draftKey: string) => boolean,
): BuilderDraftIndexEntry[] {
  const withExistingDraft = entries.filter((e) => draftKeyExists(e.draftKey));
  const byScope = new Map<string, BuilderDraftIndexEntry>();
  for (const e of withExistingDraft) {
    const prev = byScope.get(e.scope);
    if (!prev || Date.parse(e.savedAt) >= Date.parse(prev.savedAt)) {
      byScope.set(e.scope, e);
    }
  }
  return Array.from(byScope.values()).sort(
    (a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt),
  );
}

function isBuilderDraftIndexEntry(value: unknown): value is BuilderDraftIndexEntry {
  if (!isRecord(value)) {
    return false;
  }
  if (typeof value.scope !== "string" || typeof value.draftKey !== "string") {
    return false;
  }
  if (value.quizId !== null && typeof value.quizId !== "string") {
    return false;
  }
  if (typeof value.quizName !== "string" || typeof value.questionCount !== "number") {
    return false;
  }
  if (!Number.isFinite(value.questionCount)) {
    return false;
  }
  if (typeof value.savedAt !== "string" || typeof value.updatedAt !== "string") {
    return false;
  }
  if (typeof value.targetRoute !== "string") {
    return false;
  }
  return true;
}

export function parseBuilderDraftIndexJson(raw: string): BuilderDraftIndexFile | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return null;
    }
    if (parsed.formatVersion !== BUILDER_DRAFT_INDEX_FORMAT_VERSION) {
      return null;
    }
    if (!Array.isArray(parsed.entries)) {
      return null;
    }
    const entries: BuilderDraftIndexEntry[] = [];
    for (const item of parsed.entries) {
      if (isBuilderDraftIndexEntry(item)) {
        entries.push(item);
      }
    }
    return {
      formatVersion: BUILDER_DRAFT_INDEX_FORMAT_VERSION,
      entries,
    };
  } catch {
    return null;
  }
}

function persistBuilderDraftIndexFile(userId: string, file: BuilderDraftIndexFile): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(buildBuilderDraftIndexKey(userId), JSON.stringify(file));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console -- dev-only diagnostic
      console.warn("[builderLocalDraft] Failed to persist draft index", error);
    }
  }
}

function readBuilderDraftIndexFile(userId: string): BuilderDraftIndexFile | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(buildBuilderDraftIndexKey(userId));
    if (raw === null || raw === "") {
      return null;
    }
    return parseBuilderDraftIndexJson(raw);
  } catch {
    return null;
  }
}

export function loadBuilderDraftIndex(userId: string): BuilderDraftIndexEntry[] {
  if (typeof window === "undefined") {
    return [];
  }
  const file = readBuilderDraftIndexFile(userId);
  const rawEntries = file?.entries ?? [];
  const exists = (draftKey: string): boolean => hasBuilderDraft(draftKey);
  const normalized = normalizeAndPruneBuilderDraftIndexEntries(rawEntries, exists);
  const prevJson = JSON.stringify(rawEntries);
  const nextJson = JSON.stringify(normalized);
  if (prevJson !== nextJson) {
    persistBuilderDraftIndexFile(userId, {
      formatVersion: BUILDER_DRAFT_INDEX_FORMAT_VERSION,
      entries: normalized,
    });
  }
  return normalized;
}

export function updateBuilderDraftIndex(userId: string, entry: BuilderDraftIndexEntry): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const file = readBuilderDraftIndexFile(userId);
    const rawEntries = file?.entries ?? [];
    const merged = rawEntries.filter((e) => e.scope !== entry.scope);
    merged.push(entry);
    const exists = (draftKey: string): boolean => hasBuilderDraft(draftKey);
    const normalized = normalizeAndPruneBuilderDraftIndexEntries(merged, exists);
    persistBuilderDraftIndexFile(userId, {
      formatVersion: BUILDER_DRAFT_INDEX_FORMAT_VERSION,
      entries: normalized,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console -- dev-only diagnostic
      console.warn("[builderLocalDraft] updateBuilderDraftIndex failed", error);
    }
  }
}

export function removeBuilderDraftIndexEntry(userId: string, scope: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const file = readBuilderDraftIndexFile(userId);
    const rawEntries = file?.entries ?? [];
    const filtered = rawEntries.filter((e) => e.scope !== scope);
    const exists = (draftKey: string): boolean => hasBuilderDraft(draftKey);
    const normalized = normalizeAndPruneBuilderDraftIndexEntries(filtered, exists);
    persistBuilderDraftIndexFile(userId, {
      formatVersion: BUILDER_DRAFT_INDEX_FORMAT_VERSION,
      entries: normalized,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console -- dev-only diagnostic
      console.warn("[builderLocalDraft] removeBuilderDraftIndexEntry failed", error);
    }
  }
}

export function clearBuilderDraftAndIndexEntry(
  userId: string,
  scope: BuilderLocalDraftQuizScope,
): void {
  clearBuilderDraft(buildBuilderDraftKey(userId, scope));
  removeBuilderDraftIndexEntry(userId, scope === "new" ? "new" : scope);
}

export function getLatestBuilderDraftIndexEntry(
  userId: string,
): BuilderDraftIndexEntry | null {
  const list = loadBuilderDraftIndex(userId);
  return list[0] ?? null;
}

export function createBuilderLocalDraftPayload(args: {
  quiz: QuizBuilder;
  timeLimitUi: BuilderTimeLimitUi;
  sourceRoute: string;
}): BuilderLocalDraftPayload {
  return {
    formatVersion: BUILDER_LOCAL_DRAFT_FORMAT_VERSION,
    savedAt: new Date().toISOString(),
    sourceRoute: args.sourceRoute,
    quiz: args.quiz,
    timeLimitUi: args.timeLimitUi,
  };
}

export function getBuilderDraftStorageScope(args: {
  urlQuizId: string | null;
  savedQuizId: string | null;
}): BuilderLocalDraftQuizScope {
  if (args.urlQuizId) {
    return args.urlQuizId;
  }
  if (args.savedQuizId) {
    return args.savedQuizId;
  }
  return "new";
}

export function shouldOfferBuilderLocalDraftRestore(
  draft: BuilderLocalDraftPayload,
  hydratedInitialBaselineSnapshot: string,
): boolean {
  if (draft.formatVersion !== BUILDER_LOCAL_DRAFT_FORMAT_VERSION) {
    return false;
  }
  return (
    computeQuizBuilderSnapshot(draft.quiz, draft.timeLimitUi) !==
    hydratedInitialBaselineSnapshot
  );
}

function isQuizBuilder(value: unknown): value is QuizBuilder {
  if (!isRecord(value)) {
    return false;
  }
  if (typeof value.id !== "string" || typeof value.name !== "string") {
    return false;
  }
  if (value.visibility !== "PRIVATE" && value.visibility !== "PUBLIC") {
    return false;
  }
  if (!isRecord(value.settings)) {
    return false;
  }
  if (!Array.isArray(value.questions)) {
    return false;
  }
  if (value.createdBy !== "ANONYMOUS" && value.createdBy !== "USER") {
    return false;
  }
  if (typeof value.createdAt !== "string") {
    return false;
  }
  return true;
}

function isBuilderTimeLimitUi(value: unknown): value is BuilderTimeLimitUi {
  if (!isRecord(value)) {
    return false;
  }
  if (typeof value.enabled !== "boolean" || typeof value.inputValue !== "string") {
    return false;
  }
  return true;
}

export function parseBuilderLocalDraftJson(
  raw: string,
): BuilderLocalDraftPayload | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return null;
    }
    if (parsed.formatVersion !== BUILDER_LOCAL_DRAFT_FORMAT_VERSION) {
      return null;
    }
    if (typeof parsed.savedAt !== "string" || typeof parsed.sourceRoute !== "string") {
      return null;
    }
    if (!isQuizBuilder(parsed.quiz) || !isBuilderTimeLimitUi(parsed.timeLimitUi)) {
      return null;
    }
    return {
      formatVersion: BUILDER_LOCAL_DRAFT_FORMAT_VERSION,
      savedAt: parsed.savedAt,
      sourceRoute: parsed.sourceRoute,
      quiz: parsed.quiz,
      timeLimitUi: parsed.timeLimitUi,
    };
  } catch {
    return null;
  }
}

export type SaveBuilderDraftIndexMeta = {
  userId: string;
  scope: BuilderLocalDraftQuizScope;
};

export type SaveBuilderDraftResult =
  | { ok: true }
  | { ok: false; reason: "no_window" | "serialize_failed" | "storage_failed" };

export function saveBuilderDraft(
  key: string,
  payload: BuilderLocalDraftPayload,
  indexMeta?: SaveBuilderDraftIndexMeta,
): SaveBuilderDraftResult {
  if (typeof window === "undefined") {
    return { ok: false, reason: "no_window" };
  }
  let serialized: string;
  try {
    serialized = JSON.stringify(payload);
  } catch {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console -- dev-only diagnostic
      console.warn("[builderLocalDraft] Failed to serialize draft payload");
    }
    return { ok: false, reason: "serialize_failed" };
  }
  try {
    window.localStorage.setItem(key, serialized);
    if (indexMeta) {
      try {
        updateBuilderDraftIndex(
          indexMeta.userId,
          buildBuilderDraftIndexEntry({
            scope: indexMeta.scope,
            draftKey: key,
            payload,
          }),
        );
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console -- dev-only diagnostic
          console.warn("[builderLocalDraft] Index update after save failed", error);
        }
      }
    }
    return { ok: true };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console -- dev-only diagnostic
      console.warn("[builderLocalDraft] localStorage.setItem failed", error);
    }
    return { ok: false, reason: "storage_failed" };
  }
}

export function loadBuilderDraft(key: string): BuilderLocalDraftPayload | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === "") {
      return null;
    }
    return parseBuilderLocalDraftJson(raw);
  } catch {
    return null;
  }
}

export function clearBuilderDraft(key: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console -- dev-only diagnostic
      console.warn("[builderLocalDraft] localStorage.removeItem failed for key", key);
    }
  }
}

export function hasBuilderDraft(key: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const raw = window.localStorage.getItem(key);
    return raw !== null && raw !== "";
  } catch {
    return false;
  }
}
