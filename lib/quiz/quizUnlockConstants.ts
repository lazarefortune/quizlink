/** Coin cost to unlock a single quiz for the owner (2 months full access). */
export const QUIZ_UNLOCK_COIN_COST = 40;

/** How long a coin-based single-quiz unlock lasts (days). */
export const QUIZ_UNLOCK_DURATION_DAYS = 60;

/** Calendar months equivalent for coin unlock (documentation / future helpers). */
export const QUIZ_UNLOCK_DURATION_MONTHS = 2;

/**
 * Grace period after campaign expiration before detailed attempt data may be purged.
 * Purge job not implemented yet — constant only.
 */
export const QUIZ_DETAILS_PURGE_GRACE_DAYS = 30;
