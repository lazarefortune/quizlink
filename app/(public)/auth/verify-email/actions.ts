"use server";

import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { sendWelcomeEmailIfNeeded } from "@/lib/sendWelcomeEmailIfNeeded";
import { sendUserSignupNotificationIfNeeded } from "@/lib/sendUserSignupNotificationIfNeeded";
import { buildSignInHref } from "@/lib/auth/safe-callback-url";

export type VerifyEmailActionSuccess = {
  success: true;
  redirectTo: string;
  alreadyVerified?: boolean;
};

export type VerifyEmailActionFailure = {
  success: false;
  error: string;
};

export type VerifyEmailActionResult = VerifyEmailActionSuccess | VerifyEmailActionFailure;

export async function getVerifyEmailStatusAction(
  email: string,
): Promise<{ exists: boolean; isVerified: boolean }> {
  if (!prisma) {
    return { exists: false, isVerified: false };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerifiedAt: true },
  });

  if (!user) {
    return { exists: false, isVerified: false };
  }

  return { exists: true, isVerified: Boolean(user.emailVerifiedAt) };
}

export async function verifyEmailAction(
  email: string,
  code: string,
  callbackUrl?: string | null,
): Promise<VerifyEmailActionResult> {
  try {
    if (!prisma) {
      return {
        success: false,
        error: "Database not initialized",
      };
    }

    const signInRedirect = buildSignInHref(callbackUrl, { verified: true, email });

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
        success: true,
        redirectTo: signInRedirect,
        alreadyVerified: true,
      };
    }

    if (user.emailVerificationTokens.length === 0) {
      return {
        success: false,
        error: "Invalid or expired verification code",
      };
    }

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
      redirectTo: signInRedirect,
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
  locale: "fr" | "en" = "fr",
) {
  try {
    if (!prisma) {
      return {
        success: false,
        error: "Database not initialized",
      };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        success: true,
      };
    }

    if (user.emailVerifiedAt) {
      return {
        success: true,
        alreadyVerified: true,
      };
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await prisma.$transaction([
      prisma.emailVerificationToken.deleteMany({
        where: { userId: user.id },
      }),
      prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          code: verificationCode,
          expiresAt,
        },
      }),
    ]);

    await sendVerificationEmail(email, verificationCode, locale);

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
