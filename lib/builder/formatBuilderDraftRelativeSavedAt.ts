export type BuilderDraftRelativeTimeLocale = "fr" | "en";

/**
 * Formats when a draft was saved, as a short relative phrase (past-oriented).
 */
export function formatBuilderDraftRelativeSavedAt(
  savedAtIso: string,
  locale: BuilderDraftRelativeTimeLocale,
): string {
  const then = new Date(savedAtIso).getTime();
  if (!Number.isFinite(then)) {
    return "";
  }
  const diffMs = Date.now() - then;
  const rtfLocale = locale === "fr" ? "fr-FR" : "en-US";
  const rtf = new Intl.RelativeTimeFormat(rtfLocale, { numeric: "auto" });

  if (diffMs < 0) {
    const minutes = Math.max(1, Math.ceil(diffMs / 60_000));
    return rtf.format(minutes, "minute");
  }
  if (diffMs < 45_000) {
    return locale === "fr" ? "à l'instant" : "just now";
  }

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) {
    return rtf.format(-Math.max(1, minutes), "minute");
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return rtf.format(-hours, "hour");
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return rtf.format(-days, "day");
  }
  const weeks = Math.floor(days / 7);
  return rtf.format(-weeks, "week");
}
