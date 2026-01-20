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
 * SECURITY HARDENED:
 * - Uses database-level row locking (SELECT FOR UPDATE) to prevent race conditions
 * - Atomic transaction ensures coin deduction and transaction log are consistent
 * - Re-verifies coin balance WITH LOCK before deduction to prevent double-spending
 * - ADMIN users can have negative balance, but transaction is still recorded
 * - All operations are server-side only, no client-side manipulation possible
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
    // CRITICAL: Use transaction with row-level locking to prevent race conditions
    // This ensures that only one request can read and modify the balance at a time
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Lock the user row and fetch current state (SELECT FOR UPDATE)
      // This prevents concurrent transactions from reading the same balance
      const user = await tx.$queryRaw<Array<{ coinBalance: number; role: string }>>`
        SELECT coin_balance as coinBalance, role
        FROM users
        WHERE id = ${userId}
        FOR UPDATE
      `;

      if (!user || user.length === 0) {
        throw new Error("User not found");
      }

      const userData = user[0];
      const isAdmin = userData.role === "ADMIN";

      console.log(`[deductCoins] User ${userId} (${isAdmin ? "ADMIN" : "USER"}): locked balance = ${userData.coinBalance}, deducting ${amount}`);

      // Step 2: Verify coin balance WITH LOCK (prevents race conditions)
      // ADMIN users bypass this check (can go negative)
      if (!isAdmin) {
        if (userData.coinBalance < amount) {
          console.error(`[deductCoins] Insufficient coins: ${userData.coinBalance} < ${amount}`);
          throw new Error("Insufficient coins");
        }
      }

      // Step 3: Calculate new balance
      // ADMIN users can go negative, regular users cannot
      const newBalance = userData.coinBalance - amount;
      console.log(`[deductCoins] New balance will be: ${newBalance}`);

      // Step 4: Atomic update: balance + transaction log in same transaction
      // This ensures consistency - if one fails, both rollback
      await Promise.all([
        tx.user.update({
          where: { id: userId },
          data: { coinBalance: newBalance },
        }),
        tx.coinTransaction.create({
          data: {
            userId,
            amount: -amount,
            reason,
          },
        }),
      ]);

      return { success: true, newBalance };
    }, {
      isolationLevel: "Serializable", // Highest isolation level to prevent all race conditions
      timeout: 10000, // 10 second timeout
    });

    console.log(`[deductCoins] Successfully deducted ${amount} coins. New balance: ${result.newBalance}`);

    // Revalidate paths to update UI
    revalidatePath("/dashboard");
    revalidatePath("/generate");

    return result;
  } catch (error) {
    console.error("[deductCoins] Error deducting coins:", error);

    // Return appropriate error message
    if (error instanceof Error) {
      if (error.message === "User not found") {
        return { success: false, error: "User not found" };
      }
      if (error.message === "Insufficient coins") {
        return { success: false, error: "Insufficient coins" };
      }
    }

    return { success: false, error: "Failed to deduct coins" };
  }
}

/**
 * Credit coins to user's balance (admin only or refund)
 *
 * SECURITY HARDENED:
 * - Uses atomic transaction with row locking for consistency
 * - All operations are server-side only
 * - Transaction log is always created for audit trail
 *
 * @param userId - User ID to credit coins to
 * @param amount - Amount of coins to credit (must be positive)
 * @param reason - Reason for credit
 * @param skipAuthCheck - If true, skip admin check (for refunds only)
 * @returns Success status with new balance or error
 */
export async function creditCoins(
  userId: string,
  amount: number,
  reason: string,
  skipAuthCheck: boolean = false
): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  if (!prisma) {
    return { success: false, error: "Database not initialized" };
  }

  if (!skipAuthCheck) {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Only admins can credit coins (unless skipAuthCheck is true for refunds)
    if (session.user.role !== "ADMIN") {
      return { success: false, error: "Only admins can credit coins" };
    }
  }

  if (amount <= 0) {
    return { success: false, error: "Amount must be positive" };
  }

  try {
    // Use transaction with row locking for consistency
    const result = await prisma.$transaction(async (tx) => {
      // Lock the user row to prevent race conditions
      const user = await tx.$queryRaw<Array<{ coinBalance: number }>>`
        SELECT coin_balance as coinBalance
        FROM users
        WHERE id = ${userId}
        FOR UPDATE
      `;

      if (!user || user.length === 0) {
        throw new Error("User not found");
      }

      const currentBalance = user[0].coinBalance;
      const newBalance = currentBalance + amount;

      // Atomic update: balance + transaction log
      await Promise.all([
        tx.user.update({
          where: { id: userId },
          data: { coinBalance: newBalance },
        }),
        tx.coinTransaction.create({
          data: {
            userId,
            amount,
            reason,
          },
        }),
      ]);

      return { success: true, newBalance };
    }, {
      isolationLevel: "Serializable",
      timeout: 10000,
    });

    revalidatePath("/admin/coins");
    revalidatePath("/dashboard");

    return result;
  } catch (error) {
    console.error("Error crediting coins:", error);
    if (error instanceof Error && error.message === "User not found") {
      return { success: false, error: "User not found" };
    }
    return { success: false, error: "Failed to credit coins" };
  }
}

/**
 * Initialize coins for new user (called during signup)
 *
 * SECURITY HARDENED:
 * - Uses atomic transaction with row locking for consistency
 * - Ensures coin balance and transaction log are created atomically
 * - Called only during signup, so race conditions are minimal but still protected
 */
export async function initializeUserCoins(userId: string): Promise<void> {
  if (!prisma) {
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Lock the user row to prevent race conditions (even though unlikely during signup)
      const user = await tx.$queryRaw<Array<{ coinBalance: number }>>`
        SELECT coin_balance as coinBalance
        FROM users
        WHERE id = ${userId}
        FOR UPDATE
      `;

      if (!user || user.length === 0) {
        throw new Error("User not found");
      }

      // Atomic update: balance + transaction log
      await Promise.all([
        tx.user.update({
          where: { id: userId },
          data: { coinBalance: FREE_COINS_ON_SIGNUP },
        }),
        tx.coinTransaction.create({
          data: {
            userId,
            amount: FREE_COINS_ON_SIGNUP,
            reason: "Welcome bonus - Account creation",
          },
        }),
      ]);
    }, {
      isolationLevel: "Serializable",
      timeout: 10000,
    });
  } catch (error) {
    console.error("Error initializing user coins:", error);
    // Don't throw - signup should continue even if coin initialization fails
    // The user can contact support to get their welcome coins
  }
}
