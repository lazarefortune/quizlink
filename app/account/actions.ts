"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { sendEmailChangeCode } from "@/lib/email";
import { revalidatePath } from "next/cache";

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

/**
 * Delete user account and all associated data
 */
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

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return { success: false, error: "Password is incorrect" };
    }

    // Delete user (cascade will delete all associated data)
    await prisma.user.delete({
      where: { id: session.user.id },
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
