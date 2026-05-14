import type { QuizSettings } from "@/types/quiz-builder";

/** Upper bound for per-question time limit (seconds). */
export const TIME_LIMIT_SECONDS_MAX = 3600;

/** Maximum whole minutes allowed (60 × 60 s). */
export const TIME_LIMIT_MINUTES_MAX = 60;

export type BuilderTimeLimitUi = {
  enabled: boolean;
  minutes: number;
  seconds: number;
};

function isValidTotalSeconds(total: number): boolean {
  return Number.isInteger(total) && total >= 1 && total <= TIME_LIMIT_SECONDS_MAX;
}

function tryParseMinutesColonSeconds(trimmed: string): number | null {
  const match = /^(\d+):(\d{1,2})$/.exec(trimmed);
  if (!match) {
    return null;
  }
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (!Number.isInteger(minutes) || minutes < 0 || !Number.isInteger(seconds) || seconds < 0) {
    return null;
  }
  if (seconds > 59) {
    return null;
  }
  const total = minutes * 60 + seconds;
  return isValidTotalSeconds(total) ? total : null;
}

function tryParseMinuteWordForms(trimmed: string): number | null {
  const normalized = trimmed.replace(/\s+/g, " ").trim();

  const secondsOnly = /^(\d+)\s*(?:s|sec|second|seconds|secondes?)\.?$/i.exec(normalized);
  if (secondsOnly) {
    const n = Number(secondsOnly[1]);
    return Number.isInteger(n) && isValidTotalSeconds(n) ? n : null;
  }

  const withMinutes =
    /^(\d+)\s*(?:minutes|min|m)\.?(?:\s*(\d+))?(?:\s*(?:seconds|secondes|sec|s)\.?)?$/i.exec(
      normalized,
    );
  if (!withMinutes) {
    return null;
  }
  const minutesPart = Number(withMinutes[1]);
  const secondsPartRaw = withMinutes[2];
  if (!Number.isInteger(minutesPart) || minutesPart < 0) {
    return null;
  }
  if (secondsPartRaw === undefined) {
    const total = minutesPart * 60;
    return isValidTotalSeconds(total) ? total : null;
  }
  const secondsPart = Number(secondsPartRaw);
  if (!Number.isInteger(secondsPart) || secondsPart < 0 || secondsPart > 59) {
    return null;
  }
  const total = minutesPart * 60 + secondsPart;
  return isValidTotalSeconds(total) ? total : null;
}

/**
 * Parses a per-question time limit from a free-form string (e.g. AI options, legacy drafts).
 * Accepts whole seconds, M:S, and short word forms.
 * Returns null if empty or not a valid value in [1, TIME_LIMIT_SECONDS_MAX].
 */
export function parseTimeLimitSeconds(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }

  const fromColon = tryParseMinutesColonSeconds(trimmed);
  if (fromColon !== null) {
    return fromColon;
  }

  const fromWords = tryParseMinuteWordForms(trimmed);
  if (fromWords !== null) {
    return fromWords;
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

export function totalSecondsFromMinutesSeconds(minutes: number, seconds: number): number {
  return minutes * 60 + seconds;
}

export function splitTotalSecondsToParts(totalSeconds: number): { minutes: number; seconds: number } {
  const clamped = Math.min(Math.max(Math.trunc(totalSeconds), 0), TIME_LIMIT_SECONDS_MAX);
  return {
    minutes: Math.floor(clamped / 60),
    seconds: clamped % 60,
  };
}

/** True when minutes/seconds are integers in range and total is in [1, TIME_LIMIT_SECONDS_MAX]. */
export function isValidBuilderTimeLimitParts(minutes: number, seconds: number): boolean {
  if (!Number.isInteger(minutes) || !Number.isInteger(seconds)) {
    return false;
  }
  if (minutes < 0 || minutes > TIME_LIMIT_MINUTES_MAX || seconds < 0 || seconds > 59) {
    return false;
  }
  return isValidTotalSeconds(totalSecondsFromMinutesSeconds(minutes, seconds));
}

export function deriveTimeLimitUiFromSettings(settings: {
  timeLimitPerQuestion: number | null;
}): BuilderTimeLimitUi {
  const v = settings.timeLimitPerQuestion;
  if (v !== null && typeof v === "number" && Number.isFinite(v) && v > 0) {
    const truncated = Math.min(Math.max(Math.trunc(v), 1), TIME_LIMIT_SECONDS_MAX);
    const { minutes, seconds } = splitTotalSecondsToParts(truncated);
    return { enabled: true, minutes, seconds };
  }
  return { enabled: false, minutes: 0, seconds: 0 };
}

/**
 * Value used for dirty-tracking snapshots while the user edits the time limit fields.
 * When the switch is on but the pair is invalid, falls back to the last committed value in settings.
 */
export function resolvePersistedTimeLimit(
  settings: { timeLimitPerQuestion: number | null },
  ui: BuilderTimeLimitUi,
): number | null {
  if (!ui.enabled) {
    return null;
  }
  if (isValidBuilderTimeLimitParts(ui.minutes, ui.seconds)) {
    return totalSecondsFromMinutesSeconds(ui.minutes, ui.seconds);
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
  if (!isValidBuilderTimeLimitParts(ui.minutes, ui.seconds)) {
    return settings;
  }
  return {
    ...settings,
    timeLimitPerQuestion: totalSecondsFromMinutesSeconds(ui.minutes, ui.seconds),
  };
}
