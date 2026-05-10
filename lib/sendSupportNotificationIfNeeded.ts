import { sendSupportFeedbackNotificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { getSupportNotificationSettings } from "@/lib/settings/support-notification-settings";

function getAdminFeedbackUrl(): string {
  const rawBase =
    process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const base = rawBase.replace(/\/$/, "");
  return `${base}/admin/feedback`;
}

function isFeedbackType(value: string): value is "BUG" | "SUGGESTION" | "FEEDBACK" {
  return value === "BUG" || value === "SUGGESTION" || value === "FEEDBACK";
}

export async function sendSupportNotificationIfNeeded(feedbackId: string): Promise<void> {
  try {
    if (!prisma) {
      return;
    }

    const settings = await getSupportNotificationSettings();
    if (!settings.enabled || settings.emails.length === 0) {
      return;
    }

    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!feedback) {
      return;
    }

    if (!isFeedbackType(feedback.type)) {
      return;
    }

    const typeAllowed =
      (feedback.type === "BUG" && settings.notifyOnBug) ||
      (feedback.type === "SUGGESTION" && settings.notifyOnSuggestion) ||
      (feedback.type === "FEEDBACK" && settings.notifyOnFeedback);

    if (!typeAllowed) {
      return;
    }

    const adminUrl = getAdminFeedbackUrl();

    const result = await sendSupportFeedbackNotificationEmail({
      recipients: settings.emails,
      feedbackId: feedback.id,
      type: feedback.type,
      message: feedback.message,
      page: feedback.page,
      userEmail: feedback.user?.email ?? null,
      userName: feedback.user?.name ?? null,
      createdAt: feedback.createdAt,
      adminUrl,
    });

    if (!result.success) {
      console.error("[sendSupportNotificationIfNeeded] Email send failed:", result.error);
    }
  } catch (error) {
    console.error("[sendSupportNotificationIfNeeded]", error);
  }
}
