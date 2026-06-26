"use server";

import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { initializeUserCoins } from "@/lib/coins";
import { recordUserLifecycleEvent, USER_LIFECYCLE_EVENT_TYPES } from "@/lib/userLifecycleEvents";
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/legal-versions";
import { ensureDefaultUserAvatar } from "@/lib/user-avatar/ensureDefaultUserAvatar";
import { sendWelcomeEmailIfNeeded } from "@/lib/sendWelcomeEmailIfNeeded";
import { sendUserSignupNotificationIfNeeded } from "@/lib/sendUserSignupNotificationIfNeeded";
import {
  buildSignupVerifyEmailHref,
  buildSignupNameHref,
  buildSignupPasswordHref,
  resolveSafeCallbackUrl,
} from "@/lib/auth/safe-callback-url";
import {
  generateSignupVerificationCode,
  getPendingSignupExpiryDate,
  getPendingSignupStep,
  hashSignupVerificationCode,
  isPendingSignupExpired,
  isValidSignupName,
  isValidSignupPassword,
  normalizeSignupEmail,
} from "@/lib/auth/pending-signup";
import { SIGNUP_ERROR_CODES } from "@/lib/auth/signup-error-codes";

export type SignupActionSuccess = {
  success: true;
  redirectTo: string;
  email?: string;
};

export type SignupActionFailure = {
  success: false;
  error: string;
};

export type SignupActionResult = SignupActionSuccess | SignupActionFailure;

export type CompleteSignupActionSuccess = SignupActionSuccess & {
  email: string;
};

const GENERIC_SIGNUP_ERROR = "Failed to start signup. Please try again.";

async function createOrRefreshPendingSignup(
  email: string,
  locale: "fr" | "en",
): Promise<{ id: string; code: string }> {
  const code = generateSignupVerificationCode();
  const codeHash = hashSignupVerificationCode(code);
  const expiresAt = getPendingSignupExpiryDate();
  const lastCodeSentAt = new Date();

  const pendingSignup = await prisma.pendingSignup.upsert({
    where: { email },
    create: {
      email,
      codeHash,
      expiresAt,
      lastCodeSentAt,
      preferredLanguage: locale,
      attempts: 0,
    },
    update: {
      codeHash,
      expiresAt,
      lastCodeSentAt,
      verifiedAt: null,
      name: null,
      completedAt: null,
      attempts: 0,
      preferredLanguage: locale,
    },
  });

  return { id: pendingSignup.id, code };
}

export async function startEmailSignupAction(
  email: string,
  locale: "fr" | "en" = "fr",
  callbackUrl?: string | null,
): Promise<SignupActionResult> {
  try {
    if (!prisma) {
      return { success: false, error: GENERIC_SIGNUP_ERROR };
    }

    const normalizedEmail = normalizeSignupEmail(email);
    if (!normalizedEmail) {
      return { success: false, error: "Email is required" };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return {
        success: false,
        error: SIGNUP_ERROR_CODES.EMAIL_ALREADY_IN_USE,
      };
    }

    const { code } = await createOrRefreshPendingSignup(normalizedEmail, locale);
    const emailResult = await sendVerificationEmail(normalizedEmail, code, locale);
    if (!emailResult.success) {
      console.error("Failed to send signup verification email:", emailResult.error);
    }

    return {
      success: true,
      redirectTo: buildSignupVerifyEmailHref(normalizedEmail, callbackUrl),
      email: normalizedEmail,
    };
  } catch (error) {
    console.error("Error starting email signup:", error);
    return { success: false, error: GENERIC_SIGNUP_ERROR };
  }
}

export type SignupStepAccessResult =
  | { allowed: true; step: "code" | "name" | "password" }
  | { allowed: false; redirectTo: string };

export async function getSignupStepAccessAction(
  email: string,
  requiredStep: "code" | "name" | "password",
  callbackUrl?: string | null,
): Promise<SignupStepAccessResult> {
  if (!prisma) {
    return { allowed: false, redirectTo: "/auth/signup" };
  }

  const normalizedEmail = normalizeSignupEmail(email);
  if (!normalizedEmail) {
    return { allowed: false, redirectTo: "/auth/signup" };
  }

  const pendingSignup = await prisma.pendingSignup.findUnique({
    where: { email: normalizedEmail },
  });

  if (!pendingSignup || pendingSignup.completedAt) {
    return { allowed: false, redirectTo: "/auth/signup" };
  }

  const step = getPendingSignupStep(pendingSignup);
  if (step === "invalid") {
    return {
      allowed: false,
      redirectTo: buildSignupVerifyEmailHref(normalizedEmail, callbackUrl),
    };
  }

  if (step !== requiredStep) {
    if (step === "code") {
      return {
        allowed: false,
        redirectTo: buildSignupVerifyEmailHref(normalizedEmail, callbackUrl),
      };
    }
    if (step === "name") {
      return {
        allowed: false,
        redirectTo: buildSignupNameHref(normalizedEmail, callbackUrl),
      };
    }
    return {
      allowed: false,
      redirectTo: buildSignupPasswordHref(normalizedEmail, callbackUrl),
    };
  }

  return { allowed: true, step };
}

export async function saveSignupNameAction(
  email: string,
  name: string,
  callbackUrl?: string | null,
): Promise<SignupActionResult> {
  try {
    if (!prisma) {
      return { success: false, error: "Failed to save name. Please try again." };
    }

    const normalizedEmail = normalizeSignupEmail(email);
    if (!normalizedEmail) {
      return { success: false, error: "Email is required" };
    }

    if (!isValidSignupName(name)) {
      return { success: false, error: "Name is required" };
    }

    const access = await getSignupStepAccessAction(normalizedEmail, "name", callbackUrl);
    if (!access.allowed) {
      return { success: false, error: "Signup session is invalid. Please start again." };
    }

    await prisma.pendingSignup.update({
      where: { email: normalizedEmail },
      data: { name: name.trim() },
    });

    return {
      success: true,
      redirectTo: buildSignupPasswordHref(normalizedEmail, callbackUrl),
      email: normalizedEmail,
    };
  } catch (error) {
    console.error("Error saving signup name:", error);
    return { success: false, error: "Failed to save name. Please try again." };
  }
}

export async function completeSignupAction(
  email: string,
  password: string,
  callbackUrl?: string | null,
): Promise<SignupActionResult | CompleteSignupActionSuccess> {
  try {
    if (!prisma) {
      return { success: false, error: "Failed to create account. Please try again." };
    }

    const normalizedEmail = normalizeSignupEmail(email);
    if (!normalizedEmail) {
      return { success: false, error: "Email is required" };
    }

    if (!isValidSignupPassword(password)) {
      return { success: false, error: "Password must be at least 8 characters" };
    }

    const access = await getSignupStepAccessAction(normalizedEmail, "password", callbackUrl);
    if (!access.allowed) {
      return { success: false, error: "Signup session is invalid. Please start again." };
    }

    const pendingSignup = await prisma.pendingSignup.findUnique({
      where: { email: normalizedEmail },
    });

    if (
      !pendingSignup ||
      !pendingSignup.verifiedAt ||
      !pendingSignup.name?.trim() ||
      pendingSignup.completedAt ||
      isPendingSignupExpired(pendingSignup)
    ) {
      return { success: false, error: "Signup session is invalid. Please start again." };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return { success: false, error: SIGNUP_ERROR_CODES.EMAIL_ALREADY_IN_USE };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const acceptedAt = new Date();

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: pendingSignup.name!.trim(),
          email: normalizedEmail,
          passwordHash,
          preferredLanguage: pendingSignup.preferredLanguage === "en" ? "en" : "fr",
          emailVerifiedAt: pendingSignup.verifiedAt,
          termsAcceptedAt: acceptedAt,
          termsVersion: CURRENT_TERMS_VERSION,
          privacyAcceptedAt: acceptedAt,
          privacyVersion: CURRENT_PRIVACY_VERSION,
        },
      });

      await tx.pendingSignup.update({
        where: { email: normalizedEmail },
        data: { completedAt: new Date() },
      });

      return createdUser;
    });

    await recordUserLifecycleEvent(prisma, user.id, USER_LIFECYCLE_EVENT_TYPES.SIGNUP);
    await initializeUserCoins(user.id);
    await ensureDefaultUserAvatar(user.id);
    await sendWelcomeEmailIfNeeded(user.id);
    await sendUserSignupNotificationIfNeeded(user.id, "email");

    return {
      success: true,
      email: normalizedEmail,
      redirectTo: resolveSafeCallbackUrl(callbackUrl),
    };
  } catch (error) {
    console.error("Error completing signup:", error);
    return { success: false, error: "Failed to create account. Please try again." };
  }
}
