"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type SearchUsersResponse =
  | { success: true; users: Array<{ id: string; email: string; name: string; role: string; coinBalance: number; createdAt: Date; _count: { quizzes: number } }> }
  | { success: false; error: string };

export async function searchUsers(searchTerm: string): Promise<SearchUsersResponse> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // MySQL doesn't support mode: "insensitive", so we use contains which is case-insensitive by default in MySQL
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: searchTerm } },
          { name: { contains: searchTerm } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        coinBalance: true,
        createdAt: true,
        _count: {
          select: {
            quizzes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { success: true, users };
  } catch (error) {
    console.error("Error searching users:", error);
    return { success: false, error: "Failed to search users" };
  }
}

type CreditCoinsResponse = {
  success: boolean;
  error?: string;
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
    await prisma.$transaction(async (tx) => {
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

      // Prevent negative balance for non-admin users (target user, not admin doing the action)
      // Note: We check the target user's role, not the admin's role
      const targetUser = await tx.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (targetUser && targetUser.role !== "ADMIN" && newBalance < 0) {
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
            reason: `Admin credit: ${reason}`,
          },
        }),
      ]);
    }, {
      isolationLevel: "Serializable",
      timeout: 10000,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/coins");
    return { success: true };
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

type GetCoinTransactionsResponse =
  | { success: true; transactions: Array<{ id: string; amount: number; reason: string; createdAt: Date }> }
  | { success: false; error: string };

export async function getCoinTransactions(): Promise<GetCoinTransactionsResponse> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const transactions = await prisma.coinTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    });
    return { success: true, transactions };
  } catch (error) {
    console.error("Error fetching coin transactions:", error);
    return { success: false, error: "Failed to fetch transactions" };
  }
}
