const formatterCache = new Map<string, Intl.DateTimeFormat>();

export function toIntlLocale(locale: string): string {
  return locale === "fr" || locale.startsWith("fr") ? "fr-FR" : "en-US";
}

function getCachedFormatter(
  locale: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const intlLocale = toIntlLocale(locale);
  const key = JSON.stringify({ intlLocale, timeZone, options });
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(intlLocale, { ...options, timeZone });
    formatterCache.set(key, formatter);
  }
  return formatter;
}

function toDate(value: Date | string): Date {
  return typeof value === "string" ? new Date(value) : value;
}

function isValidInstant(date: Date): boolean {
  return Number.isFinite(date.getTime());
}

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

const LONG_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
};

const MONTH_YEAR_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
};

/** Localized date + time for an instant in the given IANA timezone. */
export function formatDateTime(
  value: Date | string,
  locale: string,
  timeZone: string,
): string {
  const date = toDate(value);
  if (!isValidInstant(date)) {
    return "";
  }
  return getCachedFormatter(locale, timeZone, DATE_TIME_OPTIONS).format(date);
}

/** Localized date only for an instant in the given IANA timezone. */
export function formatDate(
  value: Date | string,
  locale: string,
  timeZone: string,
): string {
  const date = toDate(value);
  if (!isValidInstant(date)) {
    return "";
  }
  return getCachedFormatter(locale, timeZone, DATE_OPTIONS).format(date);
}

/** Localized time only for an instant in the given IANA timezone. */
export function formatTime(
  value: Date | string,
  locale: string,
  timeZone: string,
): string {
  const date = toDate(value);
  if (!isValidInstant(date)) {
    return "";
  }
  return getCachedFormatter(locale, timeZone, TIME_OPTIONS).format(date);
}

/** Long weekday date for an instant (e.g. dashboard headers). */
export function formatLongDate(
  value: Date | string,
  locale: string,
  timeZone: string,
): string {
  const date = toDate(value);
  if (!isValidInstant(date)) {
    return "";
  }
  return getCachedFormatter(locale, timeZone, LONG_DATE_OPTIONS).format(date);
}

/** Month + year for an instant (e.g. "member since"). */
export function formatMonthYear(
  value: Date | string,
  locale: string,
  timeZone: string,
): string {
  const date = toDate(value);
  if (!isValidInstant(date)) {
    return "";
  }
  return getCachedFormatter(locale, timeZone, MONTH_YEAR_OPTIONS).format(date);
}

/** Compact date+time for admin tables (dd/MM HH:mm style via locale). */
export function formatCompactDateTime(
  value: Date | string,
  locale: string,
  timeZone: string,
): string {
  const date = toDate(value);
  if (!isValidInstant(date)) {
    return "";
  }
  return getCachedFormatter(locale, timeZone, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Medium date for tables (dd MMM yyyy). */
export function formatMediumDate(
  value: Date | string,
  locale: string,
  timeZone: string,
): string {
  const date = toDate(value);
  if (!isValidInstant(date)) {
    return "";
  }
  return getCachedFormatter(locale, timeZone, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeOrDash(
  value: Date | string | null | undefined,
  locale: string,
  timeZone: string,
  empty = "-",
): string {
  if (value == null) {
    return empty;
  }
  const formatted = formatDateTime(value, locale, timeZone);
  return formatted || empty;
}

export function formatDateOrDash(
  value: Date | string | null | undefined,
  locale: string,
  timeZone: string,
  empty = "-",
): string {
  if (value == null) {
    return empty;
  }
  const formatted = formatDate(value, locale, timeZone);
  return formatted || empty;
}

/**
 * Formats a civil calendar date (YYYY-MM-DD) without timezone conversion.
 * The same calendar day is shown everywhere in the world.
 */
export function formatCalendarDate(value: string, locale: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) {
    return value;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return value;
  }

  // UTC noon avoids DST edge cases when formatting the civil day.
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/** Clears formatter cache — for tests only. */
export function clearDateTimeFormatterCacheForTests(): void {
  formatterCache.clear();
}
