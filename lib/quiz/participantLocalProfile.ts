export const PARTICIPANT_LOCAL_PROFILE_STORAGE_KEY = "quizlink_participant_profile_v1";

export const PARTICIPANT_NAME_MAX_LENGTH = 80;
export const PARTICIPANT_EMAIL_MAX_LENGTH = 190;

export type ParticipantLocalProfile = {
  name?: string;
  email?: string;
  updatedAt: string;
};

function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const key = "__quizlink_ls_test__";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function normalizeStoredName(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > PARTICIPANT_NAME_MAX_LENGTH) {
    return undefined;
  }
  return trimmed;
}

function normalizeStoredEmail(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed.length > PARTICIPANT_EMAIL_MAX_LENGTH) {
    return undefined;
  }
  return trimmed;
}

function parseStoredProfile(raw: string): ParticipantLocalProfile | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    const name = normalizeStoredName(record.name);
    const email = normalizeStoredEmail(record.email);
    const updatedAt =
      typeof record.updatedAt === "string" && record.updatedAt.trim().length > 0
        ? record.updatedAt.trim()
        : null;

    if (!updatedAt || (!name && !email)) {
      return null;
    }

    const profile: ParticipantLocalProfile = { updatedAt };
    if (name) {
      profile.name = name;
    }
    if (email) {
      profile.email = email;
    }
    return profile;
  } catch {
    return null;
  }
}

export function loadParticipantLocalProfile(): ParticipantLocalProfile | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(PARTICIPANT_LOCAL_PROFILE_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return parseStoredProfile(raw);
  } catch {
    return null;
  }
}

export function saveParticipantLocalProfile(input: {
  name?: string;
  email?: string;
}): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  const name = normalizeStoredName(input.name);
  const email = normalizeStoredEmail(input.email);

  if (!name && !email) {
    clearParticipantLocalProfile();
    return;
  }

  const payload: ParticipantLocalProfile = {
    updatedAt: new Date().toISOString(),
  };
  if (name) {
    payload.name = name;
  }
  if (email) {
    payload.email = email;
  }

  try {
    window.localStorage.setItem(
      PARTICIPANT_LOCAL_PROFILE_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // ignore quota / privacy mode
  }
}

export function clearParticipantLocalProfile(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }
  try {
    window.localStorage.removeItem(PARTICIPANT_LOCAL_PROFILE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasParticipantLocalProfile(): boolean {
  return loadParticipantLocalProfile() !== null;
}
