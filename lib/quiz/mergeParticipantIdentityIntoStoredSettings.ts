import type { ParticipantIdentityMode } from "@/types/participant-identity";

/**
 * Updates only `participantIdentityMode` in stored quiz settings JSON,
 * preserving all other keys (showAnswerImmediately, timers, shuffle, etc.).
 */
export function mergeParticipantIdentityIntoStoredSettings(
  stored: unknown,
  mode: ParticipantIdentityMode,
): Record<string, unknown> {
  const raw =
    typeof stored === "object" && stored !== null
      ? { ...(stored as Record<string, unknown>) }
      : {};

  return {
    ...raw,
    participantIdentityMode: mode,
  };
}
