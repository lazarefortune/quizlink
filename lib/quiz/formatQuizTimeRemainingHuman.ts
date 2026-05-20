import type { Locale } from "@/lib/i18n";

function formatMinutesAndSecondsHuman(
  totalSeconds: number,
  locale: Locale,
): string {
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  const minUnit = "min";
  const secUnit = locale === "fr" ? "s" : "sec";

  if (remainingSeconds === 0) {
    return `${minutes}\u00a0${minUnit}`;
  }

  return `${minutes}\u00a0${minUnit}\u00a0${remainingSeconds}\u00a0${secUnit}`;
}

/** Compact display for the in-game circular timer (e.g. 1:15, 45s). */
export function formatQuizTimeRemainingCompact(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));

  if (seconds < 60) {
    return `${seconds}s`;
  }

  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/** Word-based display for intro and static labels (e.g. 1 min 15 s). */
export function formatQuizTimeRemainingHuman(
  totalSeconds: number,
  locale: Locale = "fr",
): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));

  if (seconds < 60) {
    return locale === "fr" ? `${seconds}\u00a0s` : `${seconds}\u00a0sec`;
  }

  if (seconds < 3600) {
    return formatMinutesAndSecondsHuman(seconds, locale);
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (locale === "fr") {
    return minutes > 0 ? `${hours}\u00a0h\u00a0${minutes}\u00a0min` : `${hours}\u00a0h`;
  }

  return minutes > 0 ? `${hours}\u00a0h\u00a0${minutes}\u00a0min` : `${hours}\u00a0h`;
}

export function formatQuizTimeRemainingAriaLabel(
  totalSeconds: number,
  locale: Locale = "fr",
): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));

  if (seconds < 60) {
    return locale === "fr"
      ? `${seconds} seconde${seconds > 1 ? "s" : ""} restante${seconds > 1 ? "s" : ""}`
      : `${seconds} second${seconds === 1 ? "" : "s"} left`;
  }

  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (locale === "fr") {
      if (remainingSeconds === 0) {
        return `${minutes} minute${minutes > 1 ? "s" : ""} restante${minutes > 1 ? "s" : ""}`;
      }
      return `${minutes} min ${remainingSeconds} s restantes`;
    }

    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes === 1 ? "" : "s"} left`;
    }
    return `${minutes} min ${remainingSeconds} sec left`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (locale === "fr") {
    return minutes > 0
      ? `${hours} h ${minutes} min restantes`
      : `${hours} heure${hours > 1 ? "s" : ""} restante${hours > 1 ? "s" : ""}`;
  }

  return minutes > 0
    ? `${hours} h ${minutes} min left`
    : `${hours} hour${hours === 1 ? "" : "s"} left`;
}
