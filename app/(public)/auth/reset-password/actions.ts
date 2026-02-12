"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function requestPasswordResetAction(
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
      // Don't leak user existence - return success anyway
      return {
        success: true,
      };
    }

    // Generate reset token
    const token = generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    // Delete old tokens and create new one
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      }),
    ]);

    // Send email
    await sendPasswordResetEmail(email, token, locale);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return {
      success: false,
      error: "Failed to send reset email. Please try again.",
    };
  }
}

export async function resetPasswordAction(
  token: string,
  newPassword: string
) {
  try {
    if (!prisma) {
      return {
        success: false,
        error: "Database not initialized",
      };
    }

    // Validate password
    if (newPassword.length < 8) {
      return {
        success: false,
        error: "Password must be at least 8 characters",
      };
    }

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return {
        success: false,
        error: "Invalid or expired reset token",
      };
    }

    if (resetToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      return {
        success: false,
        error: "Reset token has expired",
      };
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and delete all reset tokens for this user
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
        },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error resetting password:", error);
    return {
      success: false,
      error: "Failed to reset password. Please try again.",
    };
  }
}

export async function validateResetTokenAction(token: string) {
  try {
    if (!prisma) {
      return {
        success: false,
        valid: false,
      };
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return {
        success: true,
        valid: false,
      };
    }

    return {
      success: true,
      valid: true,
    };
  } catch (error) {
    console.error("Error validating reset token:", error);
    return {
      success: false,
      valid: false,
    };
  }
}
