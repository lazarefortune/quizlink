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

  it("returns error and does not create user when legalAccepted is false", async () => {
    const result = await signUpAction("Jane", "jane@example.com", "password123", false, "fr");

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error).toBe(
      "Tu dois accepter les CGU et la politique de confidentialité pour créer un compte.",
    );
    expect(mockUserFindUnique).not.toHaveBeenCalled();
    expect(mockUserCreate).not.toHaveBeenCalled();
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
    expect(mockInitializeUserCoins).not.toHaveBeenCalled();
    expect(mockRecordUserLifecycleEvent).not.toHaveBeenCalled();
  });

  it("returns error when legalAccepted is not strictly true", async () => {
    const result = await signUpAction(
      "Jane",
      "jane@example.com",
      "password123",
      undefined as unknown as boolean,
      "en",
    );

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error).toBe(
      "You must accept the Terms of Service and Privacy Policy to create an account.",
    );
    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it("persists legal acceptance versions when legalAccepted is true", async () => {
    const result = await signUpAction("Jane", "jane@example.com", "password123", true, "fr");

    expect(result.success).toBe(true);
    expect(mockUserCreate).toHaveBeenCalledTimes(1);
    const createArg = mockUserCreate.mock.calls[0][0];
    expect(createArg.data.termsVersion).toBe(CURRENT_TERMS_VERSION);
    expect(createArg.data.privacyVersion).toBe(CURRENT_PRIVACY_VERSION);
    expect(createArg.data.termsAcceptedAt).toBeInstanceOf(Date);
    expect(createArg.data.privacyAcceptedAt).toBeInstanceOf(Date);
    expect(createArg.data.termsAcceptedAt).toEqual(createArg.data.privacyAcceptedAt);
    expect(mockSendVerificationEmail).toHaveBeenCalled();
    expect(mockInitializeUserCoins).toHaveBeenCalledWith("new-user-id");
  });
});
