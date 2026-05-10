import { sendWelcomeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

/**
 * Sends the transactional welcome email once per account (welcomeEmailSentAt).
 * Does not use marketing notification preferences.
 */
export async function sendWelcomeEmailIfNeeded(userId: string): Promise<void> {
  try {
    if (!prisma) {
      console.error("sendWelcomeEmailIfNeeded: database not initialized", {
        userId,
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        welcomeEmailSentAt: true,
        email: true,
        name: true,
        coinBalance: true,
        preferredLanguage: true,
        passwordHash: true,
        emailVerifiedAt: true,
      },
    });

    if (!user || user.welcomeEmailSentAt !== null) {
      return;
    }

    const isEmailPasswordAccount = user.passwordHash !== null;
    if (isEmailPasswordAccount && user.emailVerifiedAt === null) {
      return;
    }

    const locale = user.preferredLanguage === "en" ? "en" : "fr";

    const result = await sendWelcomeEmail({
      to: user.email,
      name: user.name,
      coinBalance: user.coinBalance,
      locale,
    });

    if (!result.success) {
      console.error("sendWelcomeEmailIfNeeded: failed to send welcome email", {
        userId,
        error: result.error,
      });
      return;
    }

    await prisma.user.updateMany({
      where: { id: userId, welcomeEmailSentAt: null },
      data: { welcomeEmailSentAt: new Date() },
    });
  } catch (error) {
    console.error("sendWelcomeEmailIfNeeded: unexpected error", {
      userId,
      error,
    });
  }
}
