import { z } from "zod";

export const ADMIN_TEST_EMAIL_TEMPLATES = [
  "verification",
  "password_reset",
  "email_change",
  "welcome",
  "support_bug",
  "support_suggestion",
  "support_feedback",
  "user_signup_email",
  "user_signup_google",
] as const;

export type AdminTestEmailTemplate = (typeof ADMIN_TEST_EMAIL_TEMPLATES)[number];

export const adminTestEmailTemplateSchema = z.enum(ADMIN_TEST_EMAIL_TEMPLATES);

export const adminTestEmailLocaleSchema = z.enum(["fr", "en"]);

export const sendAdminTestEmailInputSchema = z.object({
  template: adminTestEmailTemplateSchema,
  locale: adminTestEmailLocaleSchema,
  recipientEmail: z.string().trim().email().optional(),
});

export type SendAdminTestEmailInput = z.infer<typeof sendAdminTestEmailInputSchema>;
