/** Legacy support types — keep for admin filters and existing rows */
export const LEGACY_FEEDBACK_TYPES = ["BUG", "SUGGESTION", "FEEDBACK"] as const;

/** New product / support types */
export const NEW_FEEDBACK_TYPES = [
  "APP_REVIEW",
  "FEATURE_REQUEST",
  "QUIZ_CREATION_REVIEW",
  "SAVE_ERROR_REPORT",
  "SUPPORT_MESSAGE",
] as const;

export const ALL_FEEDBACK_TYPES = [
  ...LEGACY_FEEDBACK_TYPES,
  ...NEW_FEEDBACK_TYPES,
] as const;

export type LegacyFeedbackType = (typeof LEGACY_FEEDBACK_TYPES)[number];
export type NewFeedbackType = (typeof NEW_FEEDBACK_TYPES)[number];
export type FeedbackTypeValue = (typeof ALL_FEEDBACK_TYPES)[number];

export const SUPPORT_FEEDBACK_TYPES = [
  "BUG",
  "SUGGESTION",
  "FEEDBACK",
  "SUPPORT_MESSAGE",
  "SAVE_ERROR_REPORT",
] as const;

export const USER_REVIEW_FEEDBACK_TYPES = [
  "APP_REVIEW",
  "FEATURE_REQUEST",
  "QUIZ_CREATION_REVIEW",
] as const;

export const FEEDBACK_CATEGORIES = [
  "QUIZ_CREATION",
  "AI",
  "SHARING",
  "RESULTS_STATS",
  "DESIGN",
  "OTHER",
] as const;

export type FeedbackCategoryValue = (typeof FEEDBACK_CATEGORIES)[number];
