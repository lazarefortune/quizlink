"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/email";
import { initializeUserCoins } from "@/lib/coins";
import { recordUserLifecycleEvent, USER_LIFECYCLE_EVENT_TYPES } from "@/lib/userLifecycleEvents";
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/legal-versions";
import { t } from "@/lib/i18n";

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function signUpAction(
  name: string,
  email: string,
  password: string,
  legalAccepted: boolean,
  locale: "fr" | "en" = "fr"
) {
  try {
    if (!prisma) {
      return {
        success: false,
        error: "Database not initialized. Please run 'pnpm prisma:generate' first.",
      };
    }

    if (legalAccepted !== true) {
      return {
        success: false,
        error: t(locale, "auth.signUp.legalRequiredError"),
      };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Don't leak user existence - return generic error
      return {
        success: false,
        error: "An account with this email already exists",
      };
    }

    // Validate name
    if (!name.trim()) {
      return {
        success: false,
        error: "Name is required",
      };
    }

    // Validate password
    if (password.length < 8) {
      return {
        success: false,
        error: "Password must be at least 8 characters",
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes

    const acceptedAt = new Date();

    // Create user and verification token in a transaction
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email,
        passwordHash,
        preferredLanguage: locale,
        termsAcceptedAt: acceptedAt,
        termsVersion: CURRENT_TERMS_VERSION,
        privacyAcceptedAt: acceptedAt,
        privacyVersion: CURRENT_PRIVACY_VERSION,
        // emailVerifiedAt is optional and defaults to null, so we don't need to set it explicitly
        emailVerificationTokens: {
          create: {
            code,
            expiresAt,
          },
        },
      },
    });

    await recordUserLifecycleEvent(prisma, user.id, USER_LIFECYCLE_EVENT_TYPES.SIGNUP);

    // Initialize coins for new user (4 free coins)
    await initializeUserCoins(user.id);

    // Recover anonymous quizzes from localStorage (if available client-side)
    // This will be handled client-side after signup, but we prepare the user account

    // Send verification email
    const emailResult = await sendVerificationEmail(email, code, locale);
    if (!emailResult.success) {
      // User is created but email failed - they can request a new code
      console.error("Failed to send verification email:", emailResult.error);
    }

    return {
      success: true,
      userId: user.id,
      email: user.email,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      error: "Failed to create account. Please try again.",
    };
  }
}
