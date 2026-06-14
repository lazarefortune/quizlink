import { describe, expect, it } from "vitest";

import { PARTICIPANT_EMAIL_MAX_LENGTH, PARTICIPANT_NAME_MAX_LENGTH } from "./participantLocalProfile";
import {
  PARTICIPANT_START_ERROR,
  validateParticipantStartInput,
} from "./validate-participant-start-input";

describe("validateParticipantStartInput", () => {
  it("allows ANONYMOUS without fields", () => {
    const result = validateParticipantStartInput({ identityMode: "ANONYMOUS" });
    expect(result).toEqual({
      ok: true,
      data: {
        identityMode: "ANONYMOUS",
        participantName: null,
        participantEmail: null,
      },
    });
  });

  it("requires name for PSEUDONYM", () => {
    const missing = validateParticipantStartInput({ identityMode: "PSEUDONYM" });
    expect(missing).toEqual({ ok: false, error: PARTICIPANT_START_ERROR.NAME_REQUIRED });

    const ok = validateParticipantStartInput({
      identityMode: "PSEUDONYM",
      participantName: "  Player  ",
    });
    expect(ok).toEqual({
      ok: true,
      data: {
        identityMode: "PSEUDONYM",
        participantName: "Player",
        participantEmail: null,
      },
    });
  });

  it("requires name, valid email and consent for NAME_EMAIL", () => {
    const noConsent = validateParticipantStartInput({
      identityMode: "NAME_EMAIL",
      participantName: "Ada",
      participantEmail: "ada@test.com",
    });
    expect(noConsent).toEqual({
      ok: false,
      error: PARTICIPANT_START_ERROR.CONSENT_REQUIRED,
    });

    const invalidEmail = validateParticipantStartInput({
      identityMode: "NAME_EMAIL",
      participantName: "Ada",
      participantEmail: "not-an-email",
      hasConsent: true,
    });
    expect(invalidEmail).toEqual({
      ok: false,
      error: PARTICIPANT_START_ERROR.EMAIL_INVALID,
    });

    const ok = validateParticipantStartInput({
      identityMode: "NAME_EMAIL",
      participantName: " Ada ",
      participantEmail: " Ada@Test.COM ",
      hasConsent: true,
    });
    expect(ok).toEqual({
      ok: true,
      data: {
        identityMode: "NAME_EMAIL",
        participantName: "Ada",
        participantEmail: "ada@test.com",
      },
    });
  });

  it("rejects overlong name and email", () => {
    const longName = "a".repeat(PARTICIPANT_NAME_MAX_LENGTH + 1);
    expect(
      validateParticipantStartInput({
        identityMode: "PSEUDONYM",
        participantName: longName,
      }),
    ).toEqual({ ok: false, error: PARTICIPANT_START_ERROR.NAME_TOO_LONG });

    const longEmail = `${"a".repeat(PARTICIPANT_EMAIL_MAX_LENGTH)}@t.com`;
    expect(
      validateParticipantStartInput({
        identityMode: "NAME_EMAIL",
        participantName: "Ada",
        participantEmail: longEmail,
        hasConsent: true,
      }),
    ).toEqual({ ok: false, error: PARTICIPANT_START_ERROR.EMAIL_TOO_LONG });
  });
});
