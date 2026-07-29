/** Legacy persisted titles that must not be accepted as valid quiz names. */
export const LEGACY_UNTITLED_QUIZ_NAMES = ["Quiz sans titre", "Untitled quiz"] as const;

export function normalizeQuizName(name: string): string {
  return name.trim();
}

export function isLegacyUntitledQuizName(name: string): boolean {
  const normalized = normalizeQuizName(name);
  return LEGACY_UNTITLED_QUIZ_NAMES.some(
    (sentinel) => sentinel.trim() === normalized,
  );
}

export function isUntitledQuizName(name: string): boolean {
  const normalized = normalizeQuizName(name);
  return normalized.length === 0 || isLegacyUntitledQuizName(name);
}

export function isValidQuizName(name: string): boolean {
  const normalized = normalizeQuizName(name);
  if (normalized.length === 0) {
    return false;
  }
  if (isLegacyUntitledQuizName(name)) {
    return false;
  }
  return true;
}

/**
 * Returns the quiz name as stored/edited in the builder.
 * Legacy sentinel titles are shown as empty so the user must pick a real name.
 */
export function resolveBuilderQuizNameForEditing(name: string): string {
  if (isLegacyUntitledQuizName(name)) {
    return "";
  }
  return name;
}

/** Display label for lists and dashboards; never persists the fallback. */
export function resolveQuizDisplayName(name: string, fallbackLabel: string): string {
  if (isUntitledQuizName(name)) {
    return fallbackLabel;
  }
  return normalizeQuizName(name);
}
