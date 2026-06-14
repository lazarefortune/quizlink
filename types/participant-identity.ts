export const PARTICIPANT_IDENTITY_MODES = [
  "ANONYMOUS",
  "PSEUDONYM",
  "NAME_EMAIL",
] as const;

export type ParticipantIdentityMode = (typeof PARTICIPANT_IDENTITY_MODES)[number];

export const DEFAULT_PARTICIPANT_IDENTITY_MODE: ParticipantIdentityMode = "ANONYMOUS";

export function isParticipantIdentityMode(value: unknown): value is ParticipantIdentityMode {
  return (
    typeof value === "string" &&
    (PARTICIPANT_IDENTITY_MODES as readonly string[]).includes(value)
  );
}
