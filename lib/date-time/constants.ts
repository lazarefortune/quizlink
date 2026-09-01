/** Cookie storing the browser-detected IANA timezone for SSR/hydration alignment. */
export const TIME_ZONE_COOKIE = "quizlink_timezone";

/** One year in seconds. */
export const TIME_ZONE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Fallback when no valid user/browser timezone is available.
 * Product default for QuizLink (French-first); not the server/container timezone.
 */
export const DEFAULT_TIME_ZONE = "Europe/Paris";
