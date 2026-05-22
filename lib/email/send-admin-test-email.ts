import {
  sendEmailChangeCode,
  sendPasswordResetEmail,
  sendSupportFeedbackNotificationEmail,
  type SupportFeedbackNotificationType,
  sendUserSignupNotificationEmail,
  type UserSignupNotificationProvider,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "@/lib/email";

import type { AdminTestEmailTemplate } from "@/lib/email/admin-test-email.schema";

const TEST_VERIFICATION_CODE = "123456";
const TEST_PASSWORD_RESET_TOKEN = "test-token-do-not-use";
const TEST_EMAIL_CHANGE_CODE = "654321";
const TEST_FEEDBACK_ID = "00000000-0000-4000-8000-000000000001";
const TEST_USER_ID = "00000000-0000-4000-8000-000000000002";
const TEST_CREATED_AT = new Date("2026-05-22T10:00:00.000Z");

function getAppBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

function getSupportFeedbackType(template: AdminTestEmailTemplate): SupportFeedbackNotificationType {
  if (template === "support_suggestion") {
    return "SUGGESTION";
  }
  if (template === "support_feedback") {
    return "FEEDBACK";
  }
  return "BUG";
}

function getSignupProvider(template: AdminTestEmailTemplate): UserSignupNotificationProvider {
  return template === "user_signup_google" ? "google" : "email";
}

export async function sendAdminTestEmail({
  template,
  locale,
  to,
}: {
  template: AdminTestEmailTemplate;
  locale: "fr" | "en";
  to: string;
}): Promise<{ success: boolean; error?: string }> {
  const baseUrl = getAppBaseUrl();
  const adminFeedbackUrl = `${baseUrl}/admin/feedback`;
  const adminUserUrl = `${baseUrl}/admin/users/${TEST_USER_ID}`;

  switch (template) {
    case "verification":
      return sendVerificationEmail(to, TEST_VERIFICATION_CODE, locale);
    case "password_reset":
      return sendPasswordResetEmail(to, TEST_PASSWORD_RESET_TOKEN, locale);
    case "email_change":
      return sendEmailChangeCode(to, TEST_EMAIL_CHANGE_CODE, locale);
    case "welcome":
      return sendWelcomeEmail({
        to,
        name: locale === "fr" ? "Utilisateur Test" : "Test User",
        coinBalance: 42,
        locale,
      });
    case "support_bug":
    case "support_suggestion":
    case "support_feedback":
      return sendSupportFeedbackNotificationEmail({
        recipients: [to],
        feedbackId: TEST_FEEDBACK_ID,
        type: getSupportFeedbackType(template),
        message:
          locale === "fr"
            ? "[TEST] Message de test pour vérifier la notification support."
            : "[TEST] Test message to verify the support notification email.",
        page: "/dashboard",
        userEmail: "test.user@example.com",
        userName: locale === "fr" ? "Utilisateur Test" : "Test User",
        createdAt: TEST_CREATED_AT,
        adminUrl: adminFeedbackUrl,
      });
    case "user_signup_email":
    case "user_signup_google":
      return sendUserSignupNotificationEmail({
        recipients: [to],
        userId: TEST_USER_ID,
        userName: locale === "fr" ? "Utilisateur Test" : "Test User",
        userEmail: "test.user@example.com",
        provider: getSignupProvider(template),
        coinBalance: 42,
        createdAt: TEST_CREATED_AT,
        adminUrl: adminUserUrl,
      });
    default: {
      const _exhaustive: never = template;
      return _exhaustive;
    }
  }
}
