"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export type CoinTransaction = {
  id: string;
  amount: number;
  reason: string;
  createdAt: Date;
};

type GetUserCoinTransactionsResponse =
  | { success: true; transactions: CoinTransaction[]; balance: number }
  | { success: false; error: string };

/**
 * Get user's coin transactions and current balance
 * SECURITY: User can only see their own transactions
 */
export async function getUserCoinTransactions(): Promise<GetUserCoinTransactionsResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const userId = session.user.id;

    // Get user's current balance and transactions in parallel
    const [user, transactions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { coinBalance: true },
      }),
      prisma.coinTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          reason: true,
          createdAt: true,
        },
      }),
    ]);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      transactions,
      balance: user.coinBalance,
    };
  } catch (error) {
    console.error("Error fetching user coin transactions:", error);
    return {
      success: false,
      error: "Failed to fetch transactions",
    };
  }
}
