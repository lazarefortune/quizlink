import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export const FINALIZE_DRAFT_QUIZ_ERROR_CODE = {
  NOT_AUTHENTICATED: "FINALIZE_NOT_AUTHENTICATED",
  NOT_OWNER: "FINALIZE_NOT_OWNER",
  QUIZ_NOT_FOUND: "FINALIZE_QUIZ_NOT_FOUND",
  NOT_DRAFT: "FINALIZE_NOT_DRAFT",
  ARCHIVED: "FINALIZE_ARCHIVED",
  NO_QUESTIONS: "FINALIZE_NO_QUESTIONS",
  VALIDATION_FAILED: "FINALIZE_VALIDATION_FAILED",
  DATABASE_ERROR: "FINALIZE_DATABASE_ERROR",
} as const;

export type FinalizeDraftQuizErrorCode =
  (typeof FINALIZE_DRAFT_QUIZ_ERROR_CODE)[keyof typeof FINALIZE_DRAFT_QUIZ_ERROR_CODE];

const ERROR_CODE_TO_I18N_KEY: Record<string, string> = {
  [FINALIZE_DRAFT_QUIZ_ERROR_CODE.NOT_AUTHENTICATED]:
    "builder.finalizeError.notAuthenticated",
  [FINALIZE_DRAFT_QUIZ_ERROR_CODE.NOT_OWNER]: "builder.finalizeError.notOwner",
  [FINALIZE_DRAFT_QUIZ_ERROR_CODE.QUIZ_NOT_FOUND]: "builder.finalizeError.quizNotFound",
  [FINALIZE_DRAFT_QUIZ_ERROR_CODE.NOT_DRAFT]: "builder.finalizeError.notDraft",
  [FINALIZE_DRAFT_QUIZ_ERROR_CODE.ARCHIVED]: "builder.finalizeError.archived",
  [FINALIZE_DRAFT_QUIZ_ERROR_CODE.NO_QUESTIONS]: "builder.finalizeError.noQuestions",
  [FINALIZE_DRAFT_QUIZ_ERROR_CODE.VALIDATION_FAILED]:
    "builder.finalizeError.validationFailed",
  [FINALIZE_DRAFT_QUIZ_ERROR_CODE.DATABASE_ERROR]: "builder.finalizeError.databaseError",
};

export function resolveFinalizeDraftQuizError(locale: Locale, error: string): string {
  const key = ERROR_CODE_TO_I18N_KEY[error];
  if (key) {
    return t(locale, key);
  }
  return error;
}
