import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZodError } from "zod";

const mockAuth = vi.fn();
const mockUpdateSupportNotificationSettings = vi.fn();
const mockUpdateUserSignupNotificationSettings = vi.fn();
const mockRevalidatePath = vi.fn();
const mockSendAdminTestEmail = vi.fn();
const mockCheckAdminTestEmailRateLimit = vi.fn();
const mockRecordAdminTestEmailSend = vi.fn();
const mockIsAdminTestEmailAllowedInEnvironment = vi.fn();
const mockCanOverrideAdminTestEmailRecipient = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/settings/support-notification-settings", () => ({
  updateSupportNotificationSettings: (...args: unknown[]) =>
    mockUpdateSupportNotificationSettings(...args),
}));

vi.mock("@/lib/settings/user-signup-notification-settings", () => ({
  updateUserSignupNotificationSettings: (...args: unknown[]) =>
    mockUpdateUserSignupNotificationSettings(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/lib/email/send-admin-test-email", () => ({
  sendAdminTestEmail: (...args: unknown[]) => mockSendAdminTestEmail(...args),
}));

vi.mock("@/lib/email/admin-test-email-rate-limit", () => ({
  checkAdminTestEmailRateLimit: (...args: unknown[]) =>
    mockCheckAdminTestEmailRateLimit(...args),
  recordAdminTestEmailSend: (...args: unknown[]) =>
    mockRecordAdminTestEmailSend(...args),
}));

vi.mock("@/lib/email/get-smtp-status", () => ({
  isAdminTestEmailAllowedInEnvironment: () => mockIsAdminTestEmailAllowedInEnvironment(),
  canOverrideAdminTestEmailRecipient: () => mockCanOverrideAdminTestEmailRecipient(),
}));

import {
  sendAdminTestEmailAction,
  updateSupportNotificationSettingsAction,
  updateUserSignupNotificationSettingsAction,
} from "./actions";

const validPayload = {
  enabled: true,
  emails: ["a@b.co"],
  notifyOnBug: true,
  notifyOnSuggestion: false,
  notifyOnFeedback: true,
};

describe("updateSupportNotificationSettingsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });
    mockUpdateSupportNotificationSettings.mockResolvedValue(validPayload);
  });

  it("returns unauthorized when there is no session user id", async () => {
    mockAuth.mockResolvedValue({ user: null });

    const result = await updateSupportNotificationSettingsAction(validPayload);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockUpdateSupportNotificationSettings).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("returns unauthorized when role is not ADMIN", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    const result = await updateSupportNotificationSettingsAction(validPayload);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockUpdateSupportNotificationSettings).not.toHaveBeenCalled();
  });

  it("persists settings and revalidates when admin is valid", async () => {
    const result = await updateSupportNotificationSettingsAction(validPayload);

    expect(result).toEqual({ success: true });
    expect(mockUpdateSupportNotificationSettings).toHaveBeenCalledWith(validPayload);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/settings");
  });

  it("returns zod message when update throws ZodError", async () => {
    mockUpdateSupportNotificationSettings.mockImplementation(() => {
      throw new ZodError([
        {
          code: "custom",
          message: "Email invalide",
          path: ["emails", 0],
        },
      ]);
    });

    const result = await updateSupportNotificationSettingsAction(validPayload);

    expect(result).toEqual({ success: false, error: "Email invalide" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("returns generic error when update throws unexpectedly", async () => {
    mockUpdateSupportNotificationSettings.mockRejectedValue(new Error("db down"));

    const result = await updateSupportNotificationSettingsAction(validPayload);

    expect(result).toEqual({ success: false, error: "Failed to save settings" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});

const validSignupPayload = {
  enabled: true,
  emails: ["a@b.co"],
  notifyOnEmailSignup: true,
  notifyOnGoogleSignup: false,
};

describe("updateUserSignupNotificationSettingsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });
    mockUpdateUserSignupNotificationSettings.mockResolvedValue(validSignupPayload);
  });

  it("returns unauthorized when there is no session user id", async () => {
    mockAuth.mockResolvedValue({ user: null });

    const result = await updateUserSignupNotificationSettingsAction(validSignupPayload);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockUpdateUserSignupNotificationSettings).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("returns unauthorized when role is not ADMIN", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    const result = await updateUserSignupNotificationSettingsAction(validSignupPayload);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockUpdateUserSignupNotificationSettings).not.toHaveBeenCalled();
  });

  it("persists settings and revalidates when admin is valid", async () => {
    const result = await updateUserSignupNotificationSettingsAction(validSignupPayload);

    expect(result).toEqual({ success: true });
    expect(mockUpdateUserSignupNotificationSettings).toHaveBeenCalledWith(
      validSignupPayload,
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/settings");
  });

  it("returns zod message when update throws ZodError", async () => {
    mockUpdateUserSignupNotificationSettings.mockImplementation(() => {
      throw new ZodError([
        {
          code: "custom",
          message: "Email invalide",
          path: ["emails", 0],
        },
      ]);
    });

    const result = await updateUserSignupNotificationSettingsAction(validSignupPayload);

    expect(result).toEqual({ success: false, error: "Email invalide" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("returns generic error when update throws unexpectedly", async () => {
    mockUpdateUserSignupNotificationSettings.mockRejectedValue(new Error("db down"));

    const result = await updateUserSignupNotificationSettingsAction(validSignupPayload);

    expect(result).toEqual({ success: false, error: "Failed to save settings" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});

const validTestEmailPayload = {
  template: "verification" as const,
  locale: "fr" as const,
};

describe("sendAdminTestEmailAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN", email: "admin@test.com" },
    });
    mockIsAdminTestEmailAllowedInEnvironment.mockReturnValue(true);
    mockCanOverrideAdminTestEmailRecipient.mockReturnValue(false);
    mockCheckAdminTestEmailRateLimit.mockReturnValue({ allowed: true });
    mockSendAdminTestEmail.mockResolvedValue({ success: true });
  });

  it("returns unauthorized when there is no session user id", async () => {
    mockAuth.mockResolvedValue({ user: null });

    const result = await sendAdminTestEmailAction(validTestEmailPayload);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockSendAdminTestEmail).not.toHaveBeenCalled();
  });

  it("returns unauthorized when role is not ADMIN", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", role: "USER", email: "user@test.com" },
    });

    const result = await sendAdminTestEmailAction(validTestEmailPayload);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockSendAdminTestEmail).not.toHaveBeenCalled();
  });

  it("sends test email to admin address and records rate limit", async () => {
    const result = await sendAdminTestEmailAction(validTestEmailPayload);

    expect(result).toEqual({ success: true });
    expect(mockSendAdminTestEmail).toHaveBeenCalledWith({
      template: "verification",
      locale: "fr",
      to: "admin@test.com",
    });
    expect(mockRecordAdminTestEmailSend).toHaveBeenCalledWith("admin-1");
  });

  it("uses override recipient in non-production", async () => {
    mockCanOverrideAdminTestEmailRecipient.mockReturnValue(true);

    const result = await sendAdminTestEmailAction({
      ...validTestEmailPayload,
      recipientEmail: "other@test.com",
    });

    expect(result).toEqual({ success: true });
    expect(mockSendAdminTestEmail).toHaveBeenCalledWith({
      template: "verification",
      locale: "fr",
      to: "other@test.com",
    });
  });

  it("returns rate limit error when sending too soon", async () => {
    mockCheckAdminTestEmailRateLimit.mockReturnValue({
      allowed: false,
      reason: "too_soon",
    });

    const result = await sendAdminTestEmailAction(validTestEmailPayload);

    expect(result).toEqual({
      success: false,
      error: "Please wait before sending another test email",
    });
    expect(mockSendAdminTestEmail).not.toHaveBeenCalled();
  });
});
