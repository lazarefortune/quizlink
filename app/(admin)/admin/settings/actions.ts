"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { auth } from "@/lib/auth";
import {
  checkAdminTestEmailRateLimit,
  recordAdminTestEmailSend,
} from "@/lib/email/admin-test-email-rate-limit";
import { sendAdminTestEmailInputSchema } from "@/lib/email/admin-test-email.schema";
import {
  canOverrideAdminTestEmailRecipient,
  isAdminTestEmailAllowedInEnvironment,
} from "@/lib/email/get-smtp-status";
import { sendAdminTestEmail } from "@/lib/email/send-admin-test-email";
import {
  updateSupportNotificationSettings,
  type SupportNotificationSettingsInput,
} from "@/lib/settings/support-notification-settings";
import {
  updateUserSignupNotificationSettings,
  type UserSignupNotificationSettingsInput,
} from "@/lib/settings/user-signup-notification-settings";

export type UpdateSupportNotificationSettingsActionResult =
  | { success: true }
  | { success: false; error: string };

export type UpdateUserSignupNotificationSettingsActionResult =
  | { success: true }
  | { success: false; error: string };

export async function updateSupportNotificationSettingsAction(
  input: SupportNotificationSettingsInput,
): Promise<UpdateSupportNotificationSettingsActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await updateSupportNotificationSettings(input);
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    if (error instanceof ZodError) {
      const first = error.issues[0];
      return {
        success: false,
        error: first?.message ?? "Invalid settings",
      };
    }
    console.error("updateSupportNotificationSettingsAction:", error);
    return { success: false, error: "Failed to save settings" };
  }
}

export async function updateUserSignupNotificationSettingsAction(
  input: UserSignupNotificationSettingsInput,
): Promise<UpdateUserSignupNotificationSettingsActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await updateUserSignupNotificationSettings(input);
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    if (error instanceof ZodError) {
      const first = error.issues[0];
      return {
        success: false,
        error: first?.message ?? "Invalid settings",
      };
    }
    console.error("updateUserSignupNotificationSettingsAction:", error);
    return { success: false, error: "Failed to save settings" };
  }
}

export type SendAdminTestEmailActionResult =
  | { success: true }
  | { success: false; error: string };

export async function sendAdminTestEmailAction(
  input: unknown,
): Promise<SendAdminTestEmailActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const adminEmail = session.user.email?.trim();
  if (!adminEmail) {
    return { success: false, error: "Admin email is required" };
  }

  if (!isAdminTestEmailAllowedInEnvironment()) {
    return { success: false, error: "Admin email tests are disabled" };
  }

  const parsed = sendAdminTestEmailInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      success: false,
      error: first?.message ?? "Invalid input",
    };
  }

  const canOverrideRecipient = canOverrideAdminTestEmailRecipient();
  const recipientEmail =
    canOverrideRecipient && parsed.data.recipientEmail
      ? parsed.data.recipientEmail
      : adminEmail;

  const rateLimit = checkAdminTestEmailRateLimit(session.user.id);
  if (!rateLimit.allowed) {
    if (rateLimit.reason === "too_soon") {
      return { success: false, error: "Please wait before sending another test email" };
    }
    return { success: false, error: "Hourly test email limit reached" };
  }

  const result = await sendAdminTestEmail({
    template: parsed.data.template,
    locale: parsed.data.locale,
    to: recipientEmail,
  });

  if (!result.success) {
    console.error("[sendAdminTestEmailAction] Failed:", {
      adminId: session.user.id,
      template: parsed.data.template,
      to: recipientEmail,
      error: result.error,
    });
    return { success: false, error: "Failed to send test email" };
  }

  recordAdminTestEmailSend(session.user.id);
  console.info("[sendAdminTestEmailAction] Sent:", {
    adminId: session.user.id,
    template: parsed.data.template,
    locale: parsed.data.locale,
    to: recipientEmail,
  });

  return { success: true };
}
