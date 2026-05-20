import type { Locale } from "@/lib/i18n";

export function formatQuizTimeRemainingHuman(
  totalSeconds: number,
  locale: Locale = "fr",
): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));

  if (seconds < 60) {
    return locale === "fr" ? `${seconds}\u00a0s` : `${seconds}\u00a0sec`;
  }

  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (locale === "fr") {
    return minutes > 0 ? `${hours}\u00a0h\u00a0${minutes}\u00a0min` : `${hours}\u00a0h`;
  }

  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
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
