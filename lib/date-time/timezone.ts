import { DEFAULT_TIME_ZONE } from "./constants";

/**
 * Validates an IANA timezone identifier via Intl.
 */
export function isValidTimeZone(value: string): boolean {
  if (!value || typeof value !== "string") {
    return false;
  }
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves the effective timezone from optional sources.
 * `null` user preference means automatic (browser/cookie).
 */
export function resolveEffectiveTimeZone(
  sources: {
    userTimeZone?: string | null;
    cookieTimeZone?: string | null;
    fallback?: string;
  } = {},
): string {
  const fallback = sources.fallback ?? DEFAULT_TIME_ZONE;

  if (sources.userTimeZone) {
    if (isValidTimeZone(sources.userTimeZone)) {
      return sources.userTimeZone;
    }
  }

  if (sources.cookieTimeZone) {
    if (isValidTimeZone(sources.cookieTimeZone)) {
      return sources.cookieTimeZone;
    }
  }

  return isValidTimeZone(fallback) ? fallback : "UTC";
}

/**
 * Reads the browser/OS timezone. Client-only — never call during SSR render.
 */
export function detectBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

/**
 * Hour (0–23) of an instant in a given IANA timezone.
 */
export function getHourInTimeZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value;
  const parsed = Number(hour);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Calendar date key (YYYY-MM-DD) for an instant in a given IANA timezone.
 */
export function toDateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}
