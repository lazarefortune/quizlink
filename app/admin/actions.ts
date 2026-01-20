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

    revalidatePath("/admin");
    revalidatePath("/admin/coins");
    return { success: true };
  } catch (error) {
    console.error("Error crediting coins:", error);
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
