"use server";

import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { sendWelcomeEmailIfNeeded } from "@/lib/sendWelcomeEmailIfNeeded";
import { sendUserSignupNotificationIfNeeded } from "@/lib/sendUserSignupNotificationIfNeeded";

export async function verifyEmailAction(
  email: string,
  code: string
) {
  try {
    if (!prisma) {
      return {
        success: false,
        error: "Database not initialized",
      };
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        emailVerificationTokens: {
          where: {
            code,
            expiresAt: {
              gt: new Date(),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: "Invalid verification code",
      };
    }

    if (user.emailVerifiedAt) {
      return {
        success: false,
        error: "Email already verified",
      };
    }

    if (user.emailVerificationTokens.length === 0) {
      return {
        success: false,
        error: "Invalid or expired verification code",
      };
    }

    // Verify email and delete all verification tokens for this user
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerifiedAt: new Date(),
        },
      }),
      prisma.emailVerificationToken.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    await sendWelcomeEmailIfNeeded(user.id);
    await sendUserSignupNotificationIfNeeded(user.id, "email");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error verifying email:", error);
    return {
      success: false,
      error: "Failed to verify email. Please try again.",
    };
  }
}

export async function resendVerificationCodeAction(
  email: string,
  locale: "fr" | "en" = "fr"
) {
  try {
    if (!prisma) {
      return {
        success: false,
        error: "Database not initialized",
      };
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't leak user existence
      return {
        success: true, // Return success even if user doesn't exist
      };
    }

    if (user.emailVerifiedAt) {
      return {
        success: false,
        error: "Email already verified",
      };
    }

    // Generate new code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Delete old tokens and create new one
    await prisma.$transaction([
      prisma.emailVerificationToken.deleteMany({
        where: { userId: user.id },
      }),
      prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          code,
          expiresAt,
        },
      }),
    ]);

    // Send email
    await sendVerificationEmail(email, code, locale);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error resending verification code:", error);
    return {
      success: false,
      error: "Failed to resend code. Please try again.",
    };
  }
}
