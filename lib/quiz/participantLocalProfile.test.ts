import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearParticipantLocalProfile,
  loadParticipantLocalProfile,
  PARTICIPANT_LOCAL_PROFILE_STORAGE_KEY,
  saveParticipantLocalProfile,
} from "./participantLocalProfile";

describe("participantLocalProfile", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when storage is empty", () => {
    expect(loadParticipantLocalProfile()).toBeNull();
  });

  it("saves and loads trimmed name and lowercase email", () => {
    saveParticipantLocalProfile({
      name: "  Alice  ",
      email: "  Alice@Example.COM ",
    });
    const profile = loadParticipantLocalProfile();
    expect(profile).toMatchObject({
      name: "Alice",
      email: "alice@example.com",
    });
    expect(profile?.updatedAt).toBeTruthy();
  });

  it("omits empty fields from stored payload", () => {
    saveParticipantLocalProfile({ name: "   " });
    expect(storage.has(PARTICIPANT_LOCAL_PROFILE_STORAGE_KEY)).toBe(false);
  });

  it("clears profile", () => {
    saveParticipantLocalProfile({ name: "Bob" });
    clearParticipantLocalProfile();
    expect(loadParticipantLocalProfile()).toBeNull();
  });

  it("does not crash when localStorage throws", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => {
          throw new Error("blocked");
        },
        removeItem: () => {
          throw new Error("blocked");
        },
      },
    });
    expect(() => saveParticipantLocalProfile({ name: "Test" })).not.toThrow();
    expect(loadParticipantLocalProfile()).toBeNull();
  });

  it("rejects invalid stored JSON", () => {
    storage.set(PARTICIPANT_LOCAL_PROFILE_STORAGE_KEY, "{not-json");
    expect(loadParticipantLocalProfile()).toBeNull();
  });
});
