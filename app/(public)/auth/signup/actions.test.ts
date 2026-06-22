import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUserFindUnique = vi.fn();
const mockUserCreate = vi.fn();
const mockBcryptHash = vi.fn();
const mockSendVerificationEmail = vi.fn();
const mockInitializeUserCoins = vi.fn();
const mockRecordUserLifecycleEvent = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      create: (...args: unknown[]) => mockUserCreate(...args),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: (...args: unknown[]) => mockBcryptHash(...args),
  },
}));

vi.mock("@/lib/email", () => ({
  sendVerificationEmail: (...args: unknown[]) => mockSendVerificationEmail(...args),
}));

vi.mock("@/lib/coins", () => ({
  initializeUserCoins: (...args: unknown[]) => mockInitializeUserCoins(...args),
}));

vi.mock("@/lib/userLifecycleEvents", () => ({
  recordUserLifecycleEvent: (...args: unknown[]) => mockRecordUserLifecycleEvent(...args),
  USER_LIFECYCLE_EVENT_TYPES: { SIGNUP: "SIGNUP" },
}));

import { signUpAction } from "./actions";
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/legal-versions";

describe("signUpAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserFindUnique.mockResolvedValue(null);
    mockBcryptHash.mockResolvedValue("hashed");
    mockUserCreate.mockResolvedValue({ id: "new-user-id" });
    mockSendVerificationEmail.mockResolvedValue({ success: true });
    mockInitializeUserCoins.mockResolvedValue(undefined);
    mockRecordUserLifecycleEvent.mockResolvedValue(undefined);
  });

  it("persists legal acceptance versions on signup", async () => {
    mockUserCreate.mockResolvedValue({ id: "new-user-id", email: "jane@example.com" });
    const result = await signUpAction("Jane", "jane@example.com", "password123", "fr");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.email).toBe("jane@example.com");
    expect(result.userId).toBe("new-user-id");
    expect(mockUserCreate).toHaveBeenCalledTimes(1);
    const createArg = mockUserCreate.mock.calls[0][0];
    expect(createArg.data.termsVersion).toBe(CURRENT_TERMS_VERSION);
    expect(createArg.data.privacyVersion).toBe(CURRENT_PRIVACY_VERSION);
    expect(createArg.data.termsAcceptedAt).toBeInstanceOf(Date);
    expect(createArg.data.privacyAcceptedAt).toBeInstanceOf(Date);
    expect(createArg.data.termsAcceptedAt).toEqual(createArg.data.privacyAcceptedAt);
    expect(mockSendVerificationEmail).toHaveBeenCalled();
    expect(mockInitializeUserCoins).toHaveBeenCalledTimes(1);
    expect(mockInitializeUserCoins).toHaveBeenCalledWith("new-user-id");
    expect(mockRecordUserLifecycleEvent).toHaveBeenCalledTimes(1);
  });

  it("returns error when email is already used and does not initialize coins", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "existing-user" });

    const result = await signUpAction("Jane", "jane@example.com", "password123", "fr");

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error).toBe("An account with this email already exists");
    expect(mockUserCreate).not.toHaveBeenCalled();
    expect(mockInitializeUserCoins).not.toHaveBeenCalled();
  });
});
