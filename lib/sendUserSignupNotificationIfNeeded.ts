import {
  sendUserSignupNotificationEmail,
  type UserSignupNotificationProvider,
} from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { getUserSignupNotificationSettings } from "@/lib/settings/user-signup-notification-settings";

function getAdminUserUrl(userId: string): string {
  const rawBase =
    process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const base = rawBase.replace(/\/$/, "");
  if (!userId) {
    return `${base}/admin/users`;
  }
  return `${base}/admin/users/${userId}`;
}

export async function sendUserSignupNotificationIfNeeded(
  userId: string,
  provider: UserSignupNotificationProvider,
): Promise<void> {
  try {
    if (!prisma) {
      return;
    }

    const settings = await getUserSignupNotificationSettings();
    if (!settings.enabled || settings.emails.length === 0) {
      return;
    }

    if (provider === "email" && !settings.notifyOnEmailSignup) {
      return;
    }
    if (provider === "google" && !settings.notifyOnGoogleSignup) {
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        coinBalance: true,
        createdAt: true,
      },
    });

    if (!user) {
      return;
    }

    const adminUrl = getAdminUserUrl(user.id);

    const result = await sendUserSignupNotificationEmail({
      recipients: settings.emails,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      provider,
      coinBalance: user.coinBalance,
      createdAt: user.createdAt,
      adminUrl,
    });

    if (!result.success) {
      console.error("[sendUserSignupNotificationIfNeeded] Email send failed:", result.error);
    }
  } catch (error) {
    console.error("[sendUserSignupNotificationIfNeeded]", error);
  }
}
