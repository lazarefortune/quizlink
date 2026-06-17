import { describe, expect, it } from "vitest";

import { mergeParticipantIdentityIntoStoredSettings } from "./mergeParticipantIdentityIntoStoredSettings";

describe("mergeParticipantIdentityIntoStoredSettings", () => {
  it("preserves existing settings keys when updating mode", () => {
    const stored = {
      showAnswerImmediately: false,
      showAnswersAtEnd: true,
      randomizeQuestions: true,
      randomizeOptions: false,
      timeLimitPerQuestion: 45,
      autoSaveEnabled: false,
    };

    const next = mergeParticipantIdentityIntoStoredSettings(stored, "NAME_EMAIL");

    expect(next).toEqual({
      ...stored,
      participantIdentityMode: "NAME_EMAIL",
    });
  });

  it("creates settings object from null stored value", () => {
    expect(mergeParticipantIdentityIntoStoredSettings(null, "PSEUDONYM")).toEqual({
      participantIdentityMode: "PSEUDONYM",
    });
  });
});
