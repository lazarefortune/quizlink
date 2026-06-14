export const UNLOCK_QUIZ_ERROR = {
  UNAUTHORIZED: "UNAUTHORIZED",
  QUIZ_NOT_FOUND: "QUIZ_NOT_FOUND",
  INSUFFICIENT_COINS: "INSUFFICIENT_COINS",
  DATABASE: "DATABASE_ERROR",
} as const;

/** Coin cost to permanently unlock a single quiz for the owner. */
export const QUIZ_UNLOCK_COIN_COST = 40;

/** Max completed responses accepted for free before paywall (COMPLETED only). */
export const FREE_QUIZ_RESPONSE_LIMIT = 20;

/**
 * Grace period after quota limit is reached before detailed attempt data may be purged.
 */
export const QUIZ_DETAILS_PURGE_GRACE_DAYS = 30;
