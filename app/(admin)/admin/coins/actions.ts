"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type SearchUserResponse =
  | { success: true; user: { id: string; email: string; name: string; coinBalance: number } }
  | { success: false; error: string };

export async function searchUserByEmail(email: string): Promise<SearchUserResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Only admins can search users
    if (session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        coinBalance: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, user };
  } catch (error) {
    console.error("Error searching user:", error);
    return { success: false, error: "Failed to search user" };
  }
}

type GetTransactionsResponse =
  | { success: true; transactions: Array<{ id: string; amount: number; reason: string; createdAt: Date }> }
  | { success: false; error: string };

export async function getUserCoinTransactions(userId: string): Promise<GetTransactionsResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Only admins can view transactions
    if (session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const transactions = await prisma.coinTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to last 50 transactions
    });

    return { success: true, transactions };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return { success: false, error: "Failed to fetch transactions" };
  }
}

type CreditCoinsResponse = {
  success: boolean;
  error?: string;
  newBalance?: number;
};

export async function creditCoinsAction(
  userId: string,
  amount: number,
  reason: string
): Promise<CreditCoinsResponse> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  if (!prisma) {
    return { success: false, error: "Database not initialized" };
  }

  if (amount === 0) {
    return { success: false, error: "Amount cannot be zero" };
  }

  try {
    // Use transaction with row locking for consistency and race condition prevention
    const result = await prisma.$transaction(async (tx) => {
      // Lock the user row to prevent race conditions
      const user = await tx.$queryRaw<Array<{ coinBalance: number; role: string }>>`
        SELECT coin_balance as coinBalance, role
        FROM users
        WHERE id = ${userId}
        FOR UPDATE
      `;

      if (!user || user.length === 0) {
        throw new Error("User not found");
      }

      const currentBalance = user[0].coinBalance;
      const targetUserRole = user[0].role;
      const newBalance = currentBalance + amount;

      // Prevent negative balance for non-admin users (target user, not admin doing the action)
      if (targetUserRole !== "ADMIN" && newBalance < 0) {
        throw new Error("Cannot reduce balance below zero for non-admin users");
      }

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
            reason: `Admin action: ${reason}`,
          },
        }),
      ]);

      return { success: true, newBalance };
    }, {
      isolationLevel: "Serializable",
      timeout: 10000,
    });

    revalidatePath("/admin/coins");
    revalidatePath("/admin");
    revalidatePath("/dashboard");

    return result;
  } catch (error) {
    console.error("Error crediting coins:", error);
    if (error instanceof Error) {
      if (error.message === "User not found") {
        return { success: false, error: "User not found" };
      }
      if (error.message.includes("Cannot reduce balance")) {
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: "Failed to update coin balance" };
  }
}
