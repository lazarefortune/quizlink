import {
  DEFAULT_PARTICIPANT_IDENTITY_MODE,
  isParticipantIdentityMode,
  type ParticipantIdentityMode,
} from "@/types/participant-identity";

import { resolveEffectiveShuffleSettings } from "./shuffleSettings";

/**
 * Effective quiz settings used at play / results time.
 *
 * All fields are non-optional: missing keys in stored settings are normalized to safe defaults
 * so consumers never need to check for `undefined`.
 *
 * Defaults (matches builder defaults):
 * - showAnswerImmediately: true
 * - showAnswersAtEnd: true (preserves behavior for older quizzes without the field)
 * - randomizeQuestions / randomizeOptions: false (legacy: options follows questions when missing)
 * - timeLimitPerQuestion: null
 */
export type EffectiveQuizSettings = {
  participantIdentityMode: ParticipantIdentityMode;
  showAnswerImmediately: boolean;
  showAnswersAtEnd: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  timeLimitPerQuestion: number | null;
};

function readBooleanWithDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readTimeLimit(value: unknown): number | null {
  if (value === null) {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
}

export function resolveEffectiveQuizSettings(raw: unknown): EffectiveQuizSettings {
  const settings =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : {};

  const shuffle = resolveEffectiveShuffleSettings({
    randomizeQuestions:
      typeof settings.randomizeQuestions === "boolean"
        ? settings.randomizeQuestions
        : undefined,
    randomizeOptions:
      typeof settings.randomizeOptions === "boolean"
        ? settings.randomizeOptions
        : undefined,
  });

  const participantIdentityMode = isParticipantIdentityMode(
    settings.participantIdentityMode,
  )
    ? settings.participantIdentityMode
    : DEFAULT_PARTICIPANT_IDENTITY_MODE;

  return {
    participantIdentityMode,
    showAnswerImmediately: readBooleanWithDefault(settings.showAnswerImmediately, true),
    showAnswersAtEnd: readBooleanWithDefault(settings.showAnswersAtEnd, true),
    randomizeQuestions: shuffle.randomizeQuestions,
    randomizeOptions: shuffle.randomizeOptions,
    timeLimitPerQuestion: readTimeLimit(settings.timeLimitPerQuestion),
  };
}
