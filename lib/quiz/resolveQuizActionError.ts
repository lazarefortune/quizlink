import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { QUIZ_ACTION_ERROR_CODE } from "@/lib/quiz/quizActionErrorCodes";

const ERROR_CODE_TO_I18N_KEY: Record<string, string> = {
  [QUIZ_ACTION_ERROR_CODE.PLAY_DRAFT]: "quiz.intro.errors.draftNotAvailable",
  [QUIZ_ACTION_ERROR_CODE.PLAY_ARCHIVED]: "quiz.intro.errors.archivedNotPlayable",
  [QUIZ_ACTION_ERROR_CODE.SHARE_REQUIRES_ACTIVE]: "dashboard.shareRequiresActiveQuiz",
  [QUIZ_ACTION_ERROR_CODE.MAKE_PUBLIC_REQUIRES_ACTIVE]:
    "dashboard.finishQuizBeforePublic",
};

export function resolveQuizActionError(locale: Locale, error: string): string {
  const key = ERROR_CODE_TO_I18N_KEY[error];
  if (key) {
    return t(locale, key);
  }
  return error;
}
