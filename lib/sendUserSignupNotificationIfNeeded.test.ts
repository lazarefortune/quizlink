import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();
const mockGetUserSignupNotificationSettings = vi.fn();
const mockSendUserSignupNotificationEmail = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

vi.mock("@/lib/settings/user-signup-notification-settings", () => ({
  getUserSignupNotificationSettings: () => mockGetUserSignupNotificationSettings(),
}));

vi.mock("@/lib/email", () => ({
  sendUserSignupNotificationEmail: (...args: unknown[]) =>
    mockSendUserSignupNotificationEmail(...args),
}));

import { sendUserSignupNotificationIfNeeded } from "./sendUserSignupNotificationIfNeeded";

const baseSettings = {
  enabled: true,
  emails: ["admin@example.com"],
  notifyOnEmailSignup: true,
  notifyOnGoogleSignup: true,
};

const baseUser = {
  id: "user-1",
  name: "Pat",
  email: "pat@example.com",
  coinBalance: 5,
  createdAt: new Date("2026-05-10T12:00:00.000Z"),
};

describe("sendUserSignupNotificationIfNeeded", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserSignupNotificationSettings.mockResolvedValue(baseSettings);
    mockFindUnique.mockResolvedValue(baseUser);
    mockSendUserSignupNotificationEmail.mockResolvedValue({ success: true });
  });

  it("does not send when notifications are disabled", async () => {
    mockGetUserSignupNotificationSettings.mockResolvedValue({
      ...baseSettings,
      enabled: false,
    });

    await sendUserSignupNotificationIfNeeded("user-1", "email");

    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockSendUserSignupNotificationEmail).not.toHaveBeenCalled();
  });

  it("does not send when recipient list is empty", async () => {
    mockGetUserSignupNotificationSettings.mockResolvedValue({
      ...baseSettings,
      emails: [],
    });

    await sendUserSignupNotificationIfNeeded("user-1", "email");

    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockSendUserSignupNotificationEmail).not.toHaveBeenCalled();
  });

  it("does not send for provider 'email' when notifyOnEmailSignup is false", async () => {
    mockGetUserSignupNotificationSettings.mockResolvedValue({
      ...baseSettings,
      notifyOnEmailSignup: false,
    });

    await sendUserSignupNotificationIfNeeded("user-1", "email");

    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockSendUserSignupNotificationEmail).not.toHaveBeenCalled();
  });

  it("does not send for provider 'google' when notifyOnGoogleSignup is false", async () => {
    mockGetUserSignupNotificationSettings.mockResolvedValue({
      ...baseSettings,
      notifyOnGoogleSignup: false,
    });

    await sendUserSignupNotificationIfNeeded("user-1", "google");

    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockSendUserSignupNotificationEmail).not.toHaveBeenCalled();
  });

  it("sends for provider 'email' when allowed", async () => {
    await sendUserSignupNotificationIfNeeded("user-1", "email");

    expect(mockSendUserSignupNotificationEmail).toHaveBeenCalledTimes(1);
    expect(mockSendUserSignupNotificationEmail).toHaveBeenCalledWith({
      recipients: ["admin@example.com"],
      userId: "user-1",
      userName: "Pat",
      userEmail: "pat@example.com",
      provider: "email",
      coinBalance: 5,
      createdAt: baseUser.createdAt,
      adminUrl: expect.stringMatching(/\/admin\/users\/user-1$/),
    });
  });

  it("sends for provider 'google' when allowed", async () => {
    await sendUserSignupNotificationIfNeeded("user-1", "google");

    expect(mockSendUserSignupNotificationEmail).toHaveBeenCalledTimes(1);
    expect(mockSendUserSignupNotificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google",
        userId: "user-1",
      }),
    );
  });

  it("does not throw when email helper returns failure", async () => {
    mockSendUserSignupNotificationEmail.mockResolvedValue({
      success: false,
      error: "smtp down",
    });

    await expect(
      sendUserSignupNotificationIfNeeded("user-1", "email"),
    ).resolves.toBeUndefined();
  });

  it("does not throw when email helper throws", async () => {
    mockSendUserSignupNotificationEmail.mockRejectedValue(new Error("network"));

    await expect(
      sendUserSignupNotificationIfNeeded("user-1", "email"),
    ).resolves.toBeUndefined();
  });

  it("does not throw when prisma findUnique throws", async () => {
    mockFindUnique.mockRejectedValue(new Error("db"));

    await expect(
      sendUserSignupNotificationIfNeeded("user-1", "email"),
    ).resolves.toBeUndefined();
  });

  it("does nothing when user is missing", async () => {
    mockFindUnique.mockResolvedValue(null);

    await sendUserSignupNotificationIfNeeded("missing", "email");

    expect(mockSendUserSignupNotificationEmail).not.toHaveBeenCalled();
  });
});
