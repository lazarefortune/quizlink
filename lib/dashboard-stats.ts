"use server";

import { prisma } from "@/lib/prisma";

export type DashboardStats = {
  quizzesCount: number;
  participantsCount: number;
  attemptsCount: number;
  coinsBalance: number;
};

/**
 * Get dashboard stats for the authenticated user (quiz owner).
 */
export async function getDashboardStats(
  ownerUserId: string
): Promise<DashboardStats | null> {
  try {
    if (!prisma) return null;

    const [user, quizzesCount, participantsCount, attemptsCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: ownerUserId },
        select: { coinBalance: true },
      }),
      prisma.quiz.count({ where: { ownerId: ownerUserId } }),
      prisma.participant.count({ where: { createdByUserId: ownerUserId } }),
      prisma.quizAttempt.count({
        where: {
          quizLink: {
            quiz: { ownerId: ownerUserId },
          },
        },
      }),
    ]);

    return {
      quizzesCount,
      participantsCount,
      attemptsCount,
      coinsBalance: user?.coinBalance ?? 0,
    };
  } catch (e) {
    console.error("getDashboardStats:", e);
    return null;
  }
}
