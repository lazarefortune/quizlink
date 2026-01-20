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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coinBalance: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const newBalance = user.coinBalance + amount;

    // Prevent negative balance for non-admin users
    if (newBalance < 0) {
      return { success: false, error: "Cannot reduce balance below zero" };
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { coinBalance: newBalance },
      }),
      prisma.coinTransaction.create({
        data: {
          userId,
          amount,
          reason: `Admin credit: ${reason}`,
        },
      }),
    ]);

    revalidatePath("/admin/coins");
    revalidatePath("/admin");
    revalidatePath("/dashboard");

    return { success: true, newBalance };
  } catch (error) {
    console.error("Error crediting coins:", error);
    return { success: false, error: "Failed to update coin balance" };
  }
}
