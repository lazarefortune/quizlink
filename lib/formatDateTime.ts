/** App display timezone — keep SSR and client formatting identical. */
export const APP_TIMEZONE = "Europe/Paris";

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "short",
  day: "numeric",
};

export function toIntlLocale(locale: string): string {
  return locale === "fr" || locale.startsWith("fr") ? "fr-FR" : "en-US";
}

function toDate(value: Date | string): Date {
  return typeof value === "string" ? new Date(value) : value;
}

/** Localized date + time in {@link APP_TIMEZONE}. */
export function formatDateTime(value: Date | string, locale: string): string {
  return toDate(value).toLocaleString(toIntlLocale(locale), DATE_TIME_OPTIONS);
}

/** Localized date only in {@link APP_TIMEZONE}. */
export function formatDate(value: Date | string, locale: string): string {
  return toDate(value).toLocaleDateString(toIntlLocale(locale), DATE_OPTIONS);
}

export function formatDateTimeOrDash(
  value: Date | string | null | undefined,
  locale: string,
  empty = "-",
): string {
  if (value == null) return empty;
  return formatDateTime(value, locale);
}

export function formatDateOrDash(
  value: Date | string | null | undefined,
  locale: string,
  empty = "-",
): string {
  if (value == null) return empty;
  return formatDate(value, locale);
}
