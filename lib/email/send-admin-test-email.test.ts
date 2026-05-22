import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSendVerificationEmail = vi.fn();
const mockSendPasswordResetEmail = vi.fn();
const mockSendEmailChangeCode = vi.fn();
const mockSendWelcomeEmail = vi.fn();
const mockSendSupportFeedbackNotificationEmail = vi.fn();
const mockSendUserSignupNotificationEmail = vi.fn();

vi.mock("@/lib/email", () => ({
  sendVerificationEmail: (...args: unknown[]) => mockSendVerificationEmail(...args),
  sendPasswordResetEmail: (...args: unknown[]) => mockSendPasswordResetEmail(...args),
  sendEmailChangeCode: (...args: unknown[]) => mockSendEmailChangeCode(...args),
  sendWelcomeEmail: (...args: unknown[]) => mockSendWelcomeEmail(...args),
  sendSupportFeedbackNotificationEmail: (...args: unknown[]) =>
    mockSendSupportFeedbackNotificationEmail(...args),
  sendUserSignupNotificationEmail: (...args: unknown[]) =>
    mockSendUserSignupNotificationEmail(...args),
}));

import { sendAdminTestEmail } from "./send-admin-test-email";

describe("sendAdminTestEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendVerificationEmail.mockResolvedValue({ success: true });
    mockSendPasswordResetEmail.mockResolvedValue({ success: true });
    mockSendEmailChangeCode.mockResolvedValue({ success: true });
    mockSendWelcomeEmail.mockResolvedValue({ success: true });
    mockSendSupportFeedbackNotificationEmail.mockResolvedValue({ success: true });
    mockSendUserSignupNotificationEmail.mockResolvedValue({ success: true });
  });

  it("sends verification email with fixture code", async () => {
    await sendAdminTestEmail({
      template: "verification",
      locale: "fr",
      to: "admin@test.com",
    });

    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      "admin@test.com",
      "123456",
      "fr",
    );
  });

  it("sends support bug notification with fixture data", async () => {
    await sendAdminTestEmail({
      template: "support_bug",
      locale: "en",
      to: "admin@test.com",
    });

    expect(mockSendSupportFeedbackNotificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        recipients: ["admin@test.com"],
        type: "BUG",
        userEmail: "test.user@example.com",
        message: expect.stringContaining("[TEST]"),
      }),
    );
  });

  it("sends google signup notification with google provider", async () => {
    await sendAdminTestEmail({
      template: "user_signup_google",
      locale: "fr",
      to: "admin@test.com",
    });

    expect(mockSendUserSignupNotificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google",
        recipients: ["admin@test.com"],
      }),
    );
  });
});
