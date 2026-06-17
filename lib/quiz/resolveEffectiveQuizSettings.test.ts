import { describe, expect, it } from "vitest";

import { resolveEffectiveQuizSettings } from "./resolveEffectiveQuizSettings";

describe("resolveEffectiveQuizSettings", () => {
  it("returns safe defaults when settings is null", () => {
    expect(resolveEffectiveQuizSettings(null)).toEqual({
      participantIdentityMode: "ANONYMOUS",
      showAnswerImmediately: true,
      showAnswersAtEnd: true,
      randomizeQuestions: false,
      randomizeOptions: false,
      timeLimitPerQuestion: null,
    });
  });

  it("returns safe defaults when settings is undefined", () => {
    expect(resolveEffectiveQuizSettings(undefined)).toEqual({
      participantIdentityMode: "ANONYMOUS",
      showAnswerImmediately: true,
      showAnswersAtEnd: true,
      randomizeQuestions: false,
      randomizeOptions: false,
      timeLimitPerQuestion: null,
    });
  });

  it("defaults showAnswersAtEnd to true when absent (legacy quiz backward compat)", () => {
    expect(
      resolveEffectiveQuizSettings({
        showAnswerImmediately: true,
        randomizeQuestions: false,
        randomizeOptions: false,
        timeLimitPerQuestion: null,
      }),
    ).toMatchObject({ showAnswersAtEnd: true });
  });

  it("preserves showAnswersAtEnd false", () => {
    expect(
      resolveEffectiveQuizSettings({
        showAnswerImmediately: false,
        showAnswersAtEnd: false,
      }),
    ).toMatchObject({
      showAnswerImmediately: false,
      showAnswersAtEnd: false,
    });
  });

  it("normalizes randomizeOptions to follow randomizeQuestions when missing (legacy)", () => {
    expect(
      resolveEffectiveQuizSettings({ randomizeQuestions: true }),
    ).toMatchObject({
      randomizeQuestions: true,
      randomizeOptions: true,
    });
  });

  it("defaults participantIdentityMode to ANONYMOUS when missing or invalid", () => {
    expect(resolveEffectiveQuizSettings({})).toMatchObject({
      participantIdentityMode: "ANONYMOUS",
    });
    expect(
      resolveEffectiveQuizSettings({ participantIdentityMode: "INVALID" }),
    ).toMatchObject({ participantIdentityMode: "ANONYMOUS" });
    expect(
      resolveEffectiveQuizSettings({ participantIdentityMode: "PSEUDONYM" }),
    ).toMatchObject({ participantIdentityMode: "PSEUDONYM" });
  });

  it("keeps timeLimitPerQuestion when finite, falls back to null otherwise", () => {
    expect(
      resolveEffectiveQuizSettings({ timeLimitPerQuestion: 30 }),
    ).toMatchObject({ timeLimitPerQuestion: 30 });
    expect(
      resolveEffectiveQuizSettings({ timeLimitPerQuestion: null }),
    ).toMatchObject({ timeLimitPerQuestion: null });
    expect(
      resolveEffectiveQuizSettings({ timeLimitPerQuestion: "invalid" }),
    ).toMatchObject({ timeLimitPerQuestion: null });
  });
});
