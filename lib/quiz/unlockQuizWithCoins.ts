import { QuizUnlockSource, QuizUnlockType } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

import { applyQuizUnlockToQuizLinks } from "./applyQuizUnlockToQuizLinks";
import { addDays } from "./quizLinkCampaign";
import { getQuizAccessState } from "./getQuizAccessState";
import {
  QUIZ_UNLOCK_COIN_COST,
  QUIZ_UNLOCK_DURATION_DAYS,
} from "./quizUnlockConstants";

export const UNLOCK_QUIZ_ERROR = {
  UNAUTHORIZED: "UNAUTHORIZED",
  QUIZ_NOT_FOUND: "QUIZ_NOT_FOUND",
  INSUFFICIENT_COINS: "INSUFFICIENT_COINS",
  DATABASE: "DATABASE_ERROR",
} as const;

export type UnlockQuizWithCoinsResult =
  | {
      success: true;
      alreadyUnlocked: boolean;
      newBalance: number;
      expiresAt: Date;
    }
  | { success: false; error: string };

export async function unlockQuizWithCoins(
  quizId: string,
  userId: string,
): Promise<UnlockQuizWithCoinsResult> {
  if (!prisma) {
    return { success: false, error: UNLOCK_QUIZ_ERROR.DATABASE };
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, ownerId: true },
  });

  if (!quiz) {
    return { success: false, error: UNLOCK_QUIZ_ERROR.QUIZ_NOT_FOUND };
  }

  if (quiz.ownerId !== userId) {
    return { success: false, error: UNLOCK_QUIZ_ERROR.UNAUTHORIZED };
  }

  const preCheck = await getQuizAccessState({ quizId, userId });
  if (preCheck.isUnlocked) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coinBalance: true },
    });
    return {
      success: true,
      alreadyUnlocked: true,
      newBalance: user?.coinBalance ?? 0,
      expiresAt: preCheck.expiresAt ?? new Date(),
    };
  }

  const expiresAt = addDays(new Date(), QUIZ_UNLOCK_DURATION_DAYS);
  const reason = `Quiz unlock: ${quizId}`;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const inTxAccess = await getQuizAccessState({
        quizId,
        userId,
        db: tx,
      });
      if (inTxAccess.isUnlocked) {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { coinBalance: true },
        });
        return {
          alreadyUnlocked: true as const,
          newBalance: user?.coinBalance ?? 0,
        };
      }

      const lockedUser = await tx.$queryRaw<Array<{ coinBalance: number }>>`
        SELECT coin_balance as coinBalance
        FROM users
        WHERE id = ${userId}
        FOR UPDATE
      `;

      if (!lockedUser.length) {
        throw new Error("User not found");
      }

      const balance = lockedUser[0].coinBalance;
      if (balance < QUIZ_UNLOCK_COIN_COST) {
        throw new Error("Insufficient coins");
      }

      const newBalance = balance - QUIZ_UNLOCK_COIN_COST;

      await tx.user.update({
        where: { id: userId },
        data: { coinBalance: newBalance },
      });

      await tx.coinTransaction.create({
        data: {
          userId,
          amount: -QUIZ_UNLOCK_COIN_COST,
          reason,
        },
      });

      await tx.quizUnlock.create({
        data: {
          quizId,
          userId,
          type: QuizUnlockType.SINGLE_QUIZ,
          source: QuizUnlockSource.COINS,
          coinsSpent: QUIZ_UNLOCK_COIN_COST,
          expiresAt,
        },
      });

      await applyQuizUnlockToQuizLinks({ quizId, expiresAt, db: tx });

      return { alreadyUnlocked: false as const, newBalance };
    });

    return {
      success: true,
      alreadyUnlocked: result.alreadyUnlocked,
      newBalance: result.newBalance,
      expiresAt,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Insufficient coins") {
        return { success: false, error: UNLOCK_QUIZ_ERROR.INSUFFICIENT_COINS };
      }
      if (error.message === "User not found") {
        return { success: false, error: UNLOCK_QUIZ_ERROR.UNAUTHORIZED };
      }
    }
    return { success: false, error: UNLOCK_QUIZ_ERROR.DATABASE };
  }
}
