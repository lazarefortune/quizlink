/**
 * Server Actions body limit for quiz save payloads.
 * Must stay aligned with `next.config.ts` → `experimental.serverActions.bodySizeLimit`.
 */
export const QUIZ_SAVE_SERVER_ACTION_BODY_SIZE_LIMIT = "10mb" as const;

export const QUIZ_SAVE_SERVER_ACTION_BODY_LIMIT_BYTES = 10 * 1024 * 1024;

/** Warn when estimated JSON payload is close to the server limit (leaves margin for encoding overhead). */
export const QUIZ_SAVE_PAYLOAD_WARN_BYTES = 8 * 1024 * 1024;

/** Max raw file size per question image in the builder (before base64 expansion). */
export const MAX_QUESTION_IMAGE_FILE_BYTES = 2 * 1024 * 1024;

export function isQuestionImageFileOverMaxSize(file: File): boolean {
  return file.size > MAX_QUESTION_IMAGE_FILE_BYTES;
}
