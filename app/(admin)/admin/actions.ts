"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type SearchUsersResponse =
  | { success: true; users: Array<{ id: string; email: string; name: string; role: string; coinBalance: number; createdAt: Date; verifiedAt: Date | null; _count: { quizzes: number } }> }
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
        emailVerifiedAt: true,
        _count: {
          select: {
            quizzes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return {
      success: true,
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        coinBalance: u.coinBalance,
        createdAt: u.createdAt,
        verifiedAt: u.emailVerifiedAt,
        _count: u._count,
      })),
    };
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

export type AdminQuizLink = {
  id: string;
  token: string;
  participantName: string | null;
  allowMultipleAttempts: boolean;
  expiresAt: Date | null;
  revokedAt: Date | null;
  attemptsCount: number;
};

export type AdminQuizQuestion = {
  id: string;
  label: string;
  type: string;
  order: number;
  optionsCount: number;
};

export type AdminQuizDetail = {
  id: string;
  name: string;
  visibility: string;
  isAnonymous: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  questionsCount: number;
  linksCount: number;
  attemptsCount: number;
  links: AdminQuizLink[];
  questions: AdminQuizQuestion[];
};

export type AdminParticipant = {
  id: string;
  name: string;
  email: string | null;
  createdAt: Date;
  linksCount: number;
  attemptsCount: number;
  links: Array<{
    id: string;
    token: string;
    quizName: string;
    attemptsCount: number;
    expiresAt: Date | null;
  }>;
};

export type AdminUserFullDetails =
  | {
      success: true;
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
        coinBalance: number;
        createdAt: Date;
      };
      quizzes: AdminQuizDetail[];
      participants: AdminParticipant[];
    }
  | { success: false; error: string };

export async function getAdminUserWithQuizzes(
  userId: string
): Promise<AdminUserFullDetails> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  if (!prisma) {
    return { success: false, error: "Database not initialized" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerifiedAt: true,
        role: true,
        coinBalance: true,
        createdAt: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Fetch quizzes with full details
    const quizzes = await prisma.quiz.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        visibility: true,
        isAnonymous: true,
        expiresAt: true,
        createdAt: true,
        questions: {
          select: {
            id: true,
            label: true,
            type: true,
            order: true,
            _count: { select: { options: true } },
          },
          orderBy: { order: "asc" },
        },
        links: {
          select: {
            id: true,
            token: true,
            allowMultipleAttempts: true,
            expiresAt: true,
            revokedAt: true,
            participant: { select: { name: true } },
            _count: { select: { attempts: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { questions: true, links: true } },
      },
    });

    // Count total attempts per quiz
    const quizIds = quizzes.map((q) => q.id);
    const attemptCounts = quizIds.length > 0
      ? await prisma.quizAttempt.groupBy({
          by: ["quizLinkId"],
          where: { quizLink: { quizId: { in: quizIds } } },
        })
      : [];

    // Build a map of quizId → total attempts
    const quizAttemptMap = new Map<string, number>();
    for (const quiz of quizzes) {
      let total = 0;
      for (const link of quiz.links) {
        total += link._count.attempts;
      }
      quizAttemptMap.set(quiz.id, total);
    }

    // Fetch participants created by this user
    const participants = await prisma.participant.findMany({
      where: { createdByUserId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        links: {
          select: {
            id: true,
            token: true,
            expiresAt: true,
            quiz: { select: { name: true } },
            _count: { select: { attempts: true } },
          },
        },
        _count: { select: { links: true, attempts: true } },
      },
    });

    return {
      success: true,
      user,
      quizzes: quizzes.map((q) => ({
        id: q.id,
        name: q.name,
        visibility: q.visibility,
        isAnonymous: q.isAnonymous,
        expiresAt: q.expiresAt,
        createdAt: q.createdAt,
        questionsCount: q._count.questions,
        linksCount: q._count.links,
        attemptsCount: quizAttemptMap.get(q.id) ?? 0,
        links: q.links.map((l) => ({
          id: l.id,
          token: l.token,
          participantName: l.participant?.name ?? null,
          allowMultipleAttempts: l.allowMultipleAttempts,
          expiresAt: l.expiresAt,
          revokedAt: l.revokedAt,
          attemptsCount: l._count.attempts,
        })),
        questions: q.questions.map((qu) => ({
          id: qu.id,
          label: qu.label,
          type: qu.type,
          order: qu.order,
          optionsCount: qu._count.options,
        })),
      })),
      participants: participants.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        createdAt: p.createdAt,
        linksCount: p._count.links,
        attemptsCount: p._count.attempts,
        links: p.links.map((l) => ({
          id: l.id,
          token: l.token,
          quizName: l.quiz.name,
          attemptsCount: l._count.attempts,
          expiresAt: l.expiresAt,
        })),
      })),
    };
  } catch (error) {
    console.error("Error fetching admin user details:", error);
    return { success: false, error: "Failed to fetch user details" };
  }
}
