/**
 * Whitelist of tags allowed inside `question.label` rich text. Shared between
 * the client and server sanitizers and the editor configuration, so every step
 * of the pipeline applies the same policy.
 *
 * V1 intentionally rejects links, images, headings, lists and any inline
 * styling beyond bold / italic / underline / strikethrough.
 */

export const QUIZ_RICH_TEXT_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
] as const;

export const QUIZ_RICH_TEXT_VOID_TAGS = new Set<string>(["br"]);

export const QUIZ_RICH_TEXT_ALLOWED_ATTRS: readonly string[] = [];

export const QUIZ_RICH_TEXT_ALLOWED_TAG_SET = new Set<string>(
  QUIZ_RICH_TEXT_ALLOWED_TAGS,
);
