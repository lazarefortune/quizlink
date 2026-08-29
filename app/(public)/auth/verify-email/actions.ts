"use server";

import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { sendWelcomeEmailIfNeeded } from "@/lib/sendWelcomeEmailIfNeeded";
import { sendUserSignupNotificationIfNeeded } from "@/lib/sendUserSignupNotificationIfNeeded";
import {
  buildSignInHref,
  buildSignupNameHref,
} from "@/lib/auth/safe-callback-url";
import {
  generateSignupVerificationCode,
  getPendingSignupExpiryDate,
  getVerificationCodeResendCooldownSeconds,
  hasPendingSignupExceededAttempts,
  hashSignupVerificationCode,
  isPendingSignupExpired,
  isSignupVerificationCodeValid,
  normalizeSignupEmail,
  PENDING_SIGNUP_MAX_CODE_ATTEMPTS,
} from "@/lib/auth/pending-signup";
import {
  EMAIL_VERIFICATION_SENT,
  EMAIL_VERIFIED,
  SIGNUP_FAILED,
} from "@/lib/analytics/events";
import { trackServer } from "@/lib/analytics/track-server";
import { getPostHogDistinctIdFromCookies } from "@/lib/analytics/posthog-distinct-id-server";
import { logger } from "@/lib/observability/logger";
import { scheduleObservabilityFlush } from "@/lib/observability/flush";

export type VerifyEmailActionSuccess = {
  success: true;
  redirectTo: string;
  alreadyVerified?: boolean;
};

export type VerifyEmailActionFailure = {
  success: false;
  error: string;
  canResend?: boolean;
};

export type VerifyEmailActionResult = VerifyEmailActionSuccess | VerifyEmailActionFailure;

const GENERIC_VERIFY_ERROR = "Invalid or expired verification code";
const GENERIC_RESEND_SUCCESS = true;

export async function getVerifyEmailStatusAction(
  email: string,
): Promise<{
  exists: boolean;
  isVerified: boolean;
  isPendingSignup: boolean;
  resendCooldownSeconds: number;
}> {
  if (!prisma) {
    return { exists: false, isVerified: false, isPendingSignup: false, resendCooldownSeconds: 0 };
  }

  const normalizedEmail = normalizeSignupEmail(email);

  const pendingSignup = await prisma.pendingSignup.findUnique({
    where: { email: normalizedEmail },
    select: { verifiedAt: true, completedAt: true, expiresAt: true, lastCodeSentAt: true },
  });

  if (pendingSignup && !pendingSignup.completedAt && pendingSignup.expiresAt > new Date()) {
    return {
      exists: true,
      isVerified: Boolean(pendingSignup.verifiedAt),
      isPendingSignup: true,
      resendCooldownSeconds: getVerificationCodeResendCooldownSeconds(pendingSignup.lastCodeSentAt),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      emailVerifiedAt: true,
      emailVerificationTokens: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  if (!user) {
    return { exists: false, isVerified: false, isPendingSignup: false, resendCooldownSeconds: 0 };
  }

  const lastLegacyCodeSentAt = user.emailVerificationTokens[0]?.createdAt;
  const resendCooldownSeconds = lastLegacyCodeSentAt
    ? getVerificationCodeResendCooldownSeconds(lastLegacyCodeSentAt)
    : 0;

  return {
    exists: true,
    isVerified: Boolean(user.emailVerifiedAt),
    isPendingSignup: false,
    resendCooldownSeconds,
  };
}

async function verifyLegacyUserEmail(
  email: string,
  code: string,
  callbackUrl?: string | null,
): Promise<VerifyEmailActionResult> {
  const signInRedirect = buildSignInHref(callbackUrl, { verified: true, email });

  const user = await prisma!.user.findUnique({
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
    return { success: false, error: GENERIC_VERIFY_ERROR };
  }

  if (user.emailVerifiedAt) {
    return {
      success: true,
      redirectTo: signInRedirect,
      alreadyVerified: true,
    };
  }

  if (user.emailVerificationTokens.length === 0) {
    return { success: false, error: GENERIC_VERIFY_ERROR, canResend: true };
  }

  await prisma!.$transaction([
    prisma!.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
      },
    }),
    prisma!.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    }),
  ]);

  await sendWelcomeEmailIfNeeded(user.id);
  await sendUserSignupNotificationIfNeeded(user.id, "email");

  const distinctId = (await getPostHogDistinctIdFromCookies()) ?? user.id;
  logger.info("auth.email_verified", {
    "auth.method": "email",
    outcome: "verified",
    "user.id": user.id,
    posthogDistinctId: distinctId,
  });
  await trackServer(user.id, EMAIL_VERIFIED, { method: "email" });

  return {
    success: true,
    redirectTo: signInRedirect,
  };
}

async function verifyPendingSignupEmail(
  email: string,
  code: string,
  callbackUrl?: string | null,
): Promise<VerifyEmailActionResult> {
  const pendingSignup = await prisma!.pendingSignup.findUnique({
    where: { email },
  });

  if (!pendingSignup || pendingSignup.completedAt) {
    return { success: false, error: GENERIC_VERIFY_ERROR };
  }

  if (pendingSignup.verifiedAt) {
    return {
      success: true,
      redirectTo: buildSignupNameHref(email, callbackUrl),
      alreadyVerified: true,
    };
  }

  if (isPendingSignupExpired(pendingSignup)) {
    return { success: false, error: GENERIC_VERIFY_ERROR, canResend: true };
  }

  if (hasPendingSignupExceededAttempts(pendingSignup)) {
    return { success: false, error: GENERIC_VERIFY_ERROR, canResend: true };
  }

  const isCodeValid = isSignupVerificationCodeValid(code, pendingSignup.codeHash);

  if (!isCodeValid) {
    const nextAttempts = pendingSignup.attempts + 1;
    await prisma!.pendingSignup.update({
      where: { email },
      data: { attempts: nextAttempts },
    });

    const distinctId = (await getPostHogDistinctIdFromCookies()) ?? "anonymous";
    await trackServer(distinctId, SIGNUP_FAILED, {
      method: "email",
      stage: "verification",
      error_code: "invalid_verification_token",
    });

    return {
      success: false,
      error: GENERIC_VERIFY_ERROR,
      canResend: nextAttempts >= PENDING_SIGNUP_MAX_CODE_ATTEMPTS,
    };
  }

  await prisma!.pendingSignup.update({
    where: { email },
    data: {
      verifiedAt: new Date(),
      attempts: 0,
    },
  });

  const distinctId = (await getPostHogDistinctIdFromCookies()) ?? "anonymous";
  logger.info("auth.email_verified", {
    "auth.method": "email",
    outcome: "verified",
    "pending.id": pendingSignup.id,
    posthogDistinctId: distinctId,
  });
  await trackServer(distinctId, EMAIL_VERIFIED, { method: "email" });

  return {
    success: true,
    redirectTo: buildSignupNameHref(email, callbackUrl),
  };
}

export async function verifyEmailAction(
  email: string,
  code: string,
  callbackUrl?: string | null,
): Promise<VerifyEmailActionResult> {
  scheduleObservabilityFlush();
  const distinctId = (await getPostHogDistinctIdFromCookies()) ?? "anonymous";

  try {
    if (!prisma) {
      return {
        success: false,
        error: "Database not initialized",
      };
    }

    const normalizedEmail = normalizeSignupEmail(email);
    if (!normalizedEmail || code.length !== 6) {
      await trackServer(distinctId, SIGNUP_FAILED, {
        method: "email",
        stage: "verification",
        error_code: "invalid_input",
      });
      return { success: false, error: GENERIC_VERIFY_ERROR };
    }

    const pendingSignup = await prisma.pendingSignup.findUnique({
      where: { email: normalizedEmail },
    });

    if (pendingSignup && !pendingSignup.completedAt) {
      if (pendingSignup.expiresAt <= new Date()) {
        logger.warn("auth.email_verification.failed", {
          "auth.method": "email",
          "auth.stage": "verification",
          outcome: "failed",
          "error.code": "expired_verification_token",
          posthogDistinctId: distinctId,
        });
        await trackServer(distinctId, SIGNUP_FAILED, {
          method: "email",
          stage: "verification",
          error_code: "expired_verification_token",
        });
        return { success: false, error: GENERIC_VERIFY_ERROR, canResend: true };
      }

      return verifyPendingSignupEmail(normalizedEmail, code, callbackUrl);
    }

    return verifyLegacyUserEmail(normalizedEmail, code, callbackUrl);
  } catch (error) {
    console.error("Error verifying email:", error);
    logger.error("auth.email_verification.failed", {
      "auth.method": "email",
      "auth.stage": "verification",
      outcome: "failed",
      "error.code": "unknown",
      posthogDistinctId: distinctId,
    });
    await trackServer(distinctId, SIGNUP_FAILED, {
      method: "email",
      stage: "verification",
      error_code: "unknown",
    });
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
  scheduleObservabilityFlush();
  const distinctId = (await getPostHogDistinctIdFromCookies()) ?? "anonymous";

  try {
    if (!prisma) {
      return {
        success: false,
        error: "Database not initialized",
      };
    }

    const normalizedEmail = normalizeSignupEmail(email);
    if (!normalizedEmail) {
      return { success: true };
    }

    const pendingSignup = await prisma.pendingSignup.findUnique({
      where: { email: normalizedEmail },
    });

    if (pendingSignup && !pendingSignup.completedAt) {
      if (pendingSignup.verifiedAt) {
        return { success: true, alreadyVerified: true };
      }

      const cooldownSeconds = getVerificationCodeResendCooldownSeconds(pendingSignup.lastCodeSentAt);
      if (cooldownSeconds > 0) {
        return {
          success: false,
          error: "RESEND_COOLDOWN",
          retryAfterSeconds: cooldownSeconds,
        };
      }

      const code = generateSignupVerificationCode();
      const codeHash = hashSignupVerificationCode(code);
      const expiresAt = getPendingSignupExpiryDate();
      const lastCodeSentAt = new Date();

      await prisma.pendingSignup.update({
        where: { email: normalizedEmail },
        data: {
          codeHash,
          expiresAt,
          lastCodeSentAt,
          attempts: 0,
        },
      });

      const emailResult = await sendVerificationEmail(normalizedEmail, code, locale);
      if (emailResult.success) {
        logger.info("auth.email_verification.sent", {
          "auth.method": "email",
          outcome: "resent",
          "pending.id": pendingSignup.id,
          posthogDistinctId: distinctId,
        });
        await trackServer(distinctId, EMAIL_VERIFICATION_SENT, { method: "email" });
      } else {
        logger.error("auth.email_verification.failed", {
          "auth.method": "email",
          "auth.stage": "verification_email",
          outcome: "failed",
          "error.code": "verification_email_failed",
          posthogDistinctId: distinctId,
        });
        await trackServer(distinctId, SIGNUP_FAILED, {
          method: "email",
          stage: "verification_email",
          error_code: "verification_email_failed",
        });
      }
      return { success: true };
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        emailVerificationTokens: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return { success: GENERIC_RESEND_SUCCESS };
    }

    if (user.emailVerifiedAt) {
      return {
        success: true,
        alreadyVerified: true,
      };
    }

    const lastLegacyCodeSentAt = user.emailVerificationTokens[0]?.createdAt;
    if (lastLegacyCodeSentAt) {
      const cooldownSeconds = getVerificationCodeResendCooldownSeconds(lastLegacyCodeSentAt);
      if (cooldownSeconds > 0) {
        return {
          success: false,
          error: "RESEND_COOLDOWN",
          retryAfterSeconds: cooldownSeconds,
        };
      }
    }

    const verificationCode = generateSignupVerificationCode();
    const expiresAt = getPendingSignupExpiryDate();

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

    const emailResult = await sendVerificationEmail(normalizedEmail, verificationCode, locale);
    if (emailResult.success) {
      logger.info("auth.email_verification.sent", {
        "auth.method": "email",
        outcome: "resent",
        "user.id": user.id,
        posthogDistinctId: distinctId,
      });
      await trackServer(user.id, EMAIL_VERIFICATION_SENT, { method: "email" });
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error resending verification code:", error);
    logger.error("auth.email_verification.failed", {
      "auth.method": "email",
      "auth.stage": "verification_email",
      outcome: "failed",
      "error.code": "unknown",
      posthogDistinctId: distinctId,
    });
    return {
      success: false,
      error: "Failed to resend code. Please try again.",
    };
  }
}
