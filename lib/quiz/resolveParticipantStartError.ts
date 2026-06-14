import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { resolveQuizActionError } from "@/lib/quiz/resolveQuizActionError";

import {
  PARTICIPANT_START_ERROR,
  type ParticipantStartErrorCode,
} from "./validate-participant-start-input";

const ERROR_TO_I18N_KEY: Record<ParticipantStartErrorCode, string> = {
  [PARTICIPANT_START_ERROR.NAME_REQUIRED]: "quiz.participantNameRequired",
  [PARTICIPANT_START_ERROR.EMAIL_REQUIRED]: "quiz.participantEmailRequired",
  [PARTICIPANT_START_ERROR.EMAIL_INVALID]: "quiz.participantEmailInvalid",
  [PARTICIPANT_START_ERROR.CONSENT_REQUIRED]: "quiz.participantConsentRequired",
  [PARTICIPANT_START_ERROR.NAME_TOO_LONG]: "quiz.participantNameTooLong",
  [PARTICIPANT_START_ERROR.EMAIL_TOO_LONG]: "quiz.participantEmailTooLong",
};

export function isParticipantStartError(error: string): error is ParticipantStartErrorCode {
  return error in ERROR_TO_I18N_KEY;
}

export function resolveParticipantStartError(
  locale: Locale,
  error: string,
): string {
  const key = ERROR_TO_I18N_KEY[error as ParticipantStartErrorCode];
  if (key) {
    return t(locale, key);
  }
  return error;
}

export function resolvePublicQuizStartError(locale: Locale, error: string): string {
  if (isParticipantStartError(error)) {
    return resolveParticipantStartError(locale, error);
  }
  return resolveQuizActionError(locale, error);
}
