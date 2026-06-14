"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { sendEmailChangeCode } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { recordUserLifecycleEvent, USER_LIFECYCLE_EVENT_TYPES } from "@/lib/userLifecycleEvents";
import { z } from "zod";
import { generateUserAvatar } from "@/lib/user-avatar/generateUserAvatar";
import {
  serializeUserAvatarConfig,
  userAvatarConfigSchema,
} from "@/lib/user-avatar/userAvatarConfigSchema";

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

type UpdateProfileResponse = {
  success: boolean;
  error?: string;
};

type ChangePasswordResponse = {
  success: boolean;
  error?: string;
};

type RequestEmailChangeResponse = {
  success: boolean;
  error?: string;
};

type VerifyEmailChangeResponse = {
  success: boolean;
  error?: string;
};

type DeleteAccountResponse = {
  success: boolean;
  error?: string;
};

type UpdateNotificationPreferencesResponse = {
  success: boolean;
  error?: string;
};

type UpdateUserAvatarResponse = {
  success: boolean;
  avatar?: string;
  error?: string;
};

const notificationPreferencesSchema = z.object({
  notifyQuizResponses: z.boolean(),
  notifyProductUpdates: z.boolean(),
  notifyMarketing: z.boolean(),
});

/**
 * Update email notification preferences (optional categories only).
 * Transactional emails (security, verification, purchases) are not controlled here.
 */
export async function updateNotificationPreferencesAction(
  input: unknown
): Promise<UpdateNotificationPreferencesResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = notificationPreferencesSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid notification preferences" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        notifyQuizResponses: parsed.data.notifyQuizResponses,
        notifyProductUpdates: parsed.data.notifyProductUpdates,
        notifyMarketing: parsed.data.notifyMarketing,
      },
    });

    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update notification preferences",
    };
  }
}

const preferredLanguageSchema = z.enum(["fr", "en"]);

/**
 * Update only the user's preferred interface language (e.g. from dashboard menu).
 */
export async function updatePreferredLanguage(
  preferredLanguage: unknown,
): Promise<UpdateProfileResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = preferredLanguageSchema.safeParse(preferredLanguage);
    if (!parsed.success) {
      return { success: false, error: "Invalid language" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { preferredLanguage: parsed.data },
    });

    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("Error updating preferred language:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update preferred language",
    };
  }
}

export async function updateUserAvatarAction(
  input: unknown,
): Promise<UpdateUserAvatarResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = userAvatarConfigSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid avatar configuration" };
    }

    const avatar = generateUserAvatar(parsed.data);
    const avatarConfig = serializeUserAvatarConfig(parsed.data);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        avatar,
        avatarConfig,
      },
    });

    revalidatePath("/account");
    revalidatePath("/dashboard");

    return { success: true, avatar };
  } catch (error) {
    console.error("Error updating user avatar:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update avatar",
    };
  }
}

/**
 * Update user profile (name and preferred language)
 */
export async function updateProfile(
  name: string,
  preferredLanguage: "fr" | "en"
): Promise<UpdateProfileResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (!name.trim()) {
      return { success: false, error: "Name is required" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        preferredLanguage,
      },
    });

    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}

/**
 * Change user password
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (!user.passwordHash) {
      return { success: false, error: "This account uses Google sign-in. Password change is not available." };
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Validate new password
    if (newPassword.length < 8) {
      return {
        success: false,
        error: "New password must be at least 8 characters",
      };
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error changing password:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to change password",
    };
  }
}

/**
 * Request email change - sends verification code to new email
 */
export async function requestEmailChange(
  newEmail: string,
  locale: "fr" | "en" = "fr"
): Promise<RequestEmailChangeResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return { success: false, error: "Invalid email format" };
    }

    // Check if new email is different from current
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      return {
        success: false,
        error: "New email must be different from current email",
      };
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail.toLowerCase() },
    });

    if (existingUser) {
      // Don't leak user existence
      return {
        success: false,
        error: "This email is already in use",
      };
    }

    // Delete any existing email change tokens for this user
    await prisma.emailChangeToken.deleteMany({
      where: { userId: session.user.id },
    });

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes

    // Create email change token
    await prisma.emailChangeToken.create({
      data: {
        userId: session.user.id,
        newEmail: newEmail.toLowerCase(),
        code,
        expiresAt,
      },
    });

    // Send verification code to new email
    const emailResult = await sendEmailChangeCode(newEmail, code, locale);
    if (!emailResult.success) {
      console.error("Failed to send email change code:", emailResult.error);
      return {
        success: false,
        error: "Failed to send verification code. Please try again.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error requesting email change:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to request email change",
    };
  }
}

/**
 * Verify email change code and update email
 */
export async function verifyEmailChange(
  code: string
): Promise<VerifyEmailChangeResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Find valid token
    const token = await prisma.emailChangeToken.findFirst({
      where: {
        userId: session.user.id,
        code,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!token) {
      return {
        success: false,
        error: "Invalid or expired verification code",
      };
    }

    // Check if new email is still available
    const existingUser = await prisma.user.findUnique({
      where: { email: token.newEmail },
    });

    if (existingUser) {
      // Email was taken between request and verification
      await prisma.emailChangeToken.delete({
        where: { id: token.id },
      });
      return {
        success: false,
        error: "This email is already in use",
      };
    }

    // Update user email and mark as verified
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        email: token.newEmail,
        emailVerifiedAt: new Date(),
      },
    });

    // Delete all email change tokens for this user
    await prisma.emailChangeToken.deleteMany({
      where: { userId: session.user.id },
    });

    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("Error verifying email change:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify email change",
    };
  }
}

type UnlinkGoogleResponse = {
  success: boolean;
  error?: string;
};

/**
 * Unlink Google account — only allowed if the user has a password
 */
export async function unlinkGoogleAccount(): Promise<UnlinkGoogleResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { googleId: true, passwordHash: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (!user.googleId) {
      return { success: false, error: "No Google account linked" };
    }

    if (!user.passwordHash) {
      return {
        success: false,
        error: "Cannot unlink Google when it is the only sign-in method. Set a password first.",
      };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { googleId: null },
    });

    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("Error unlinking Google account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unlink Google account",
    };
  }
}

/**
 * Delete account for Google-only users (no password required)
 */
export async function deleteAccountGoogle(): Promise<DeleteAccountResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.passwordHash) {
      return { success: false, error: "Password is required to delete this account" };
    }

    await prisma.$transaction(async (tx) => {
      await recordUserLifecycleEvent(tx, session.user.id, USER_LIFECYCLE_EVENT_TYPES.ACCOUNT_DELETION);
      await tx.user.delete({
        where: { id: session.user.id },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting Google account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete account",
    };
  }
}
export async function deleteAccount(
  password: string
): Promise<DeleteAccountResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (!user.passwordHash) {
      return { success: false, error: "This account uses Google sign-in. Please contact support to delete your account." };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return { success: false, error: "Password is incorrect" };
    }

    // Delete user (cascade will delete all associated data)
    await prisma.$transaction(async (tx) => {
      await recordUserLifecycleEvent(tx, session.user.id, USER_LIFECYCLE_EVENT_TYPES.ACCOUNT_DELETION);
      await tx.user.delete({
        where: { id: session.user.id },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete account",
    };
  }
}
