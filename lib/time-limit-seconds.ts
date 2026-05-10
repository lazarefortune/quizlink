import type { QuizSettings } from "@/types/quiz-builder";

/** Upper bound for per-question time limit (seconds). */
export const TIME_LIMIT_SECONDS_MAX = 3600;

export type BuilderTimeLimitUi = {
  enabled: boolean;
  inputValue: string;
};

/**
 * Parses a whole seconds value for the builder input.
 * Returns null if empty or not a valid integer in [1, TIME_LIMIT_SECONDS_MAX].
 */
export function parseTimeLimitSeconds(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }
  const n = Number(trimmed);
  if (!Number.isInteger(n)) {
    return null;
  }
  if (n < 1 || n > TIME_LIMIT_SECONDS_MAX) {
    return null;
  }
  return n;
}

export function deriveTimeLimitUiFromSettings(settings: {
  timeLimitPerQuestion: number | null;
}): BuilderTimeLimitUi {
  const v = settings.timeLimitPerQuestion;
  if (v !== null && typeof v === "number" && Number.isFinite(v) && v > 0) {
    const truncated = Math.min(Math.max(Math.trunc(v), 1), TIME_LIMIT_SECONDS_MAX);
    return { enabled: true, inputValue: String(truncated) };
  }
  return { enabled: false, inputValue: "" };
}

/**
 * Value used for dirty-tracking snapshots while the user edits the time limit field.
 * When the switch is on but the input is empty or invalid, falls back to the last
 * committed numeric value in settings so the draft string still distinguishes dirty state.
 */
export function resolvePersistedTimeLimit(
  settings: { timeLimitPerQuestion: number | null },
  ui: BuilderTimeLimitUi,
): number | null {
  if (!ui.enabled) {
    return null;
  }
  const parsed = parseTimeLimitSeconds(ui.inputValue);
  if (parsed !== null) {
    return parsed;
  }
  return settings.timeLimitPerQuestion;
}

export function buildQuizSettingsWithResolvedTimeLimit(
  settings: QuizSettings,
  ui: BuilderTimeLimitUi,
): QuizSettings {
  if (!ui.enabled) {
    return { ...settings, timeLimitPerQuestion: null };
  }
  const parsed = parseTimeLimitSeconds(ui.inputValue);
  if (parsed === null) {
    return settings;
  }
  return { ...settings, timeLimitPerQuestion: parsed };
}
