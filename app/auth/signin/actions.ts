"use server";

import { prisma } from "@/lib/prisma";

export async function checkEmailVerified(email: string) {
  try {
    if (!prisma) {
      return { exists: false, verified: false };
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerifiedAt: true },
    });

    return {
      exists: !!user,
      verified: !!user?.emailVerifiedAt,
    };
  } catch (error) {
    console.error("Error checking email verification:", error);
    return { exists: false, verified: false };
  }
}
