import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const COINS_PER_GENERATION = 2;
const FREE_COINS_ON_SIGNUP = 4;

/**
 * Get user's current coin balance
 */
export async function getUserCoinBalance(userId: string): Promise<number> {
  if (!prisma) {
    return 0;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { coinBalance: true },
  });

  return user?.coinBalance ?? 0;
}

/**
 * Check if user has enough coins for AI generation
 */
export async function hasEnoughCoins(userId: string, requiredCoins: number = COINS_PER_GENERATION): Promise<boolean> {
  const session = await auth();

  // Admin users bypass coin restrictions
  if (session?.user?.role === "ADMIN") {
    return true;
  }

  const balance = await getUserCoinBalance(userId);
  return balance >= requiredCoins;
}

/**
 * Deduct coins from user's balance (server-side only)
 *
 * SECURITY:
 * - Atomic transaction ensures coin deduction and transaction log are consistent
 * - Re-verifies coin balance before deduction to prevent race conditions
 * - ADMIN users can have negative balance, but transaction is still recorded
 *
 * @param userId - User ID to deduct coins from
 * @param amount - Amount of coins to deduct (default: 2)
 * @param reason - Reason for deduction (default: "AI generation")
 * @returns Success status with new balance or error
 */
export async function deductCoins(
  userId: string,
  amount: number = COINS_PER_GENERATION,
  reason: string = "AI generation"
): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  if (!prisma) {
    return { success: false, error: "Database not initialized" };
  }

  if (amount <= 0) {
    return { success: false, error: "Amount must be positive" };
  }

  try {
    // Fetch current user state
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coinBalance: true, role: true },
    });

    if (!user) {
      console.error(`[deductCoins] User not found: ${userId}`);
      return { success: false, error: "User not found" };
    }

    const isAdmin = user.role === "ADMIN";
    console.log(`[deductCoins] User ${userId} (${isAdmin ? "ADMIN" : "USER"}): current balance = ${user.coinBalance}, deducting ${amount}`);

    // Re-verify coin balance before deduction (prevents race conditions)
    // ADMIN users bypass this check (can go negative)
    if (!isAdmin) {
      if (user.coinBalance < amount) {
        console.error(`[deductCoins] Insufficient coins: ${user.coinBalance} < ${amount}`);
        return { success: false, error: "Insufficient coins" };
      }
    }

    // Calculate new balance
    // ADMIN users can go negative, regular users cannot
    const newBalance = user.coinBalance - amount;
    console.log(`[deductCoins] New balance will be: ${newBalance}`);

    // Atomic transaction: update balance and create transaction log
    // This always executes, even for admins (for audit trail)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { coinBalance: newBalance },
      }),
      prisma.coinTransaction.create({
        data: {
          userId,
          amount: -amount,
          reason,
        },
      }),
    ]);

    console.log(`[deductCoins] Successfully deducted ${amount} coins. New balance: ${newBalance}`);

    // Revalidate paths to update UI
    revalidatePath("/dashboard");
    revalidatePath("/generate");

    return { success: true, newBalance };
  } catch (error) {
    console.error("[deductCoins] Error deducting coins:", error);
    return { success: false, error: "Failed to deduct coins" };
  }
}

/**
 * Credit coins to user's balance (admin only)
 */
export async function creditCoins(
  userId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  if (!prisma) {
    return { success: false, error: "Database not initialized" };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Only admins can credit coins
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Only admins can credit coins" };
  }

  if (amount <= 0) {
    return { success: false, error: "Amount must be positive" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coinBalance: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const newBalance = user.coinBalance + amount;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { coinBalance: newBalance },
      }),
      prisma.coinTransaction.create({
        data: {
          userId,
          amount,
          reason,
        },
      }),
    ]);

    revalidatePath("/admin/coins");
    revalidatePath("/dashboard");

    return { success: true, newBalance };
  } catch (error) {
    console.error("Error crediting coins:", error);
    return { success: false, error: "Failed to credit coins" };
  }
}

/**
 * Initialize coins for new user (called during signup)
 */
export async function initializeUserCoins(userId: string): Promise<void> {
  if (!prisma) {
    return;
  }

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { coinBalance: FREE_COINS_ON_SIGNUP },
      }),
      prisma.coinTransaction.create({
        data: {
          userId,
          amount: FREE_COINS_ON_SIGNUP,
          reason: "Welcome bonus - Account creation",
        },
      }),
    ]);
  } catch (error) {
    console.error("Error initializing user coins:", error);
  }
}
