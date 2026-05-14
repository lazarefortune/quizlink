/**
 * Helpers purs pour `audit-question-images-storage.ts` (`scripts/audit/`).
 * Tests colocalises : `audit-question-images-storage.helpers.test.ts`.
 */
import path from "path";

/**
 * Converts an absolute file path under `storageRoot` into the relative storage key
 * used in DB (`userId/quizId/name.ext`). Returns null if the file is not under the root.
 */
export function relativeImageKeyFromAbsoluteFilePath(
  storageRoot: string,
  absoluteFilePath: string,
): string | null {
  const rootResolved = path.resolve(storageRoot);
  const fileResolved = path.resolve(absoluteFilePath);
  const prefix = rootResolved.endsWith(path.sep) ? rootResolved : `${rootResolved}${path.sep}`;
  if (fileResolved === rootResolved) {
    return null;
  }
  if (!fileResolved.startsWith(prefix)) {
    return null;
  }
  const rel = fileResolved.slice(prefix.length);
  if (rel.length === 0) {
    return null;
  }
  return rel.split(path.sep).join("/");
}

export function normalizeStorageKeyForCompare(key: string): string {
  return key.trim().replace(/\\/g, "/");
}

export function buildReferencedKeySet(imageKeys: readonly string[]): Set<string> {
  const set = new Set<string>();
  for (const raw of imageKeys) {
    const normalized = normalizeStorageKeyForCompare(raw);
    if (normalized.length > 0) {
      set.add(normalized);
    }
  }
  return set;
}

export function partitionDiskKeysByReference(
  diskKeys: readonly string[],
  referencedKeys: ReadonlySet<string>,
): { orphanKeys: string[] } {
  const orphanKeys: string[] = [];
  for (const key of diskKeys) {
    const normalized = normalizeStorageKeyForCompare(key);
    if (!referencedKeys.has(normalized)) {
      orphanKeys.push(normalized);
    }
  }
  orphanKeys.sort();
  return { orphanKeys };
}
