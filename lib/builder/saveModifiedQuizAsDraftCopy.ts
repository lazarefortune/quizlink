export const SAVE_MODIFIED_QUIZ_AS_DRAFT_COPY_ERROR = {
  UNAUTHORIZED: "Unauthorized",
  QUIZ_NOT_FOUND: "Quiz not found",
  VALIDATION_FAILED: "Validation failed",
  INVALID_IMAGE_KEY: "Invalid question image reference",
  SAVE_FAILED: "Failed to create draft copy",
} as const;

export type SaveModifiedQuizAsDraftCopyResult =
  | { success: true; quizId: string }
  | { success: false; error: string };
