import { z } from "zod";

import {
  PARTICIPANT_EMAIL_MAX_LENGTH,
  PARTICIPANT_NAME_MAX_LENGTH,
} from "@/lib/quiz/participantLocalProfile";
import type { ParticipantIdentityMode } from "@/types/participant-identity";

export const PARTICIPANT_START_ERROR = {
  NAME_REQUIRED: "participantNameRequired",
  EMAIL_REQUIRED: "participantEmailRequired",
  EMAIL_INVALID: "participantEmailInvalid",
  NAME_TOO_LONG: "participantNameTooLong",
  EMAIL_TOO_LONG: "participantEmailTooLong",
  CONSENT_REQUIRED: "participantConsentRequired",
} as const;

export type ParticipantStartErrorCode =
  (typeof PARTICIPANT_START_ERROR)[keyof typeof PARTICIPANT_START_ERROR];

export type ValidatedParticipantStartInput = {
  identityMode: ParticipantIdentityMode;
  participantName: string | null;
  participantEmail: string | null;
};

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(PARTICIPANT_EMAIL_MAX_LENGTH)
  .email();

function normalizeName(raw: string | undefined): string {
  return (raw ?? "").trim();
}

function normalizeEmail(raw: string | undefined): string {
  return (raw ?? "").trim().toLowerCase();
}

export function validateParticipantStartInput(params: {
  identityMode: ParticipantIdentityMode;
  participantName?: string;
  participantEmail?: string;
  hasConsent?: boolean;
}):
  | { ok: true; data: ValidatedParticipantStartInput }
  | { ok: false; error: ParticipantStartErrorCode } {
  const { identityMode } = params;

  if (identityMode === "ANONYMOUS") {
    return {
      ok: true,
      data: {
        identityMode,
        participantName: null,
        participantEmail: null,
      },
    };
  }

  const name = normalizeName(params.participantName);
  if (!name) {
    return { ok: false, error: PARTICIPANT_START_ERROR.NAME_REQUIRED };
  }
  if (name.length > PARTICIPANT_NAME_MAX_LENGTH) {
    return { ok: false, error: PARTICIPANT_START_ERROR.NAME_TOO_LONG };
  }

  if (identityMode === "PSEUDONYM") {
    return {
      ok: true,
      data: {
        identityMode,
        participantName: name,
        participantEmail: null,
      },
    };
  }

  const email = normalizeEmail(params.participantEmail);
  if (!email) {
    return { ok: false, error: PARTICIPANT_START_ERROR.EMAIL_REQUIRED };
  }
  if (email.length > PARTICIPANT_EMAIL_MAX_LENGTH) {
    return { ok: false, error: PARTICIPANT_START_ERROR.EMAIL_TOO_LONG };
  }

  const emailResult = emailSchema.safeParse(email);
  if (!emailResult.success) {
    return { ok: false, error: PARTICIPANT_START_ERROR.EMAIL_INVALID };
  }

  if (!params.hasConsent) {
    return { ok: false, error: PARTICIPANT_START_ERROR.CONSENT_REQUIRED };
  }

  return {
    ok: true,
    data: {
      identityMode,
      participantName: name,
      participantEmail: emailResult.data,
    },
  };
}
