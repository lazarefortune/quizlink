import type { Prisma, QuizUnlockType } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

import { getActiveUserSubscriptionAccess } from "./getActiveUserSubscriptionAccess";

export type QuizUnlockedBy = "QUIZ_UNLOCK" | "SUBSCRIPTION" | "ADMIN" | null;

export type QuizAccessState = {
  isUnlocked: boolean;
  unlockedBy: QuizUnlockedBy;
  expiresAt: Date | null;
  activeQuizUnlockId: string | null;
};

export type GetQuizAccessStateParams = {
  quizId: string;
  userId: string;
  now?: Date;
  /** Optional transaction client for use inside unlock flows. */
  db?: Prisma.TransactionClient;
};

function mapUnlockTypeToUnlockedBy(type: QuizUnlockType): QuizUnlockedBy {
  if (type === "SUBSCRIPTION") {
    return "SUBSCRIPTION";
  }
  if (type === "ADMIN") {
    return "ADMIN";
  }
  return "QUIZ_UNLOCK";
}

/** Active when permanent (`null`) or not yet expired. */
export function isActiveQuizUnlockExpiresAt(
  expiresAt: Date | null,
  now: Date,
): boolean {
  return expiresAt == null || expiresAt > now;
}

export function buildActiveQuizUnlockWhere(
  quizId: string,
  userId: string,
  now: Date,
): Prisma.QuizUnlockWhereInput {
  return {
    quizId,
    userId,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}

export async function getQuizAccessState({
  quizId,
  userId,
  now = new Date(),
  db,
}: GetQuizAccessStateParams): Promise<QuizAccessState> {
  const client = db ?? prisma;
  if (!client) {
    return {
      isUnlocked: false,
      unlockedBy: null,
      expiresAt: null,
      activeQuizUnlockId: null,
    };
  }

  const subscription = await getActiveUserSubscriptionAccess(userId);
  if (subscription.isActive) {
    return {
      isUnlocked: true,
      unlockedBy: "SUBSCRIPTION",
      expiresAt: subscription.expiresAt,
      activeQuizUnlockId: null,
    };
  }

  const activeUnlock = await client.quizUnlock.findFirst({
    where: buildActiveQuizUnlockWhere(quizId, userId, now),
    orderBy: [{ expiresAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      type: true,
      expiresAt: true,
    },
  });

  if (activeUnlock) {
    return {
      isUnlocked: true,
      unlockedBy: mapUnlockTypeToUnlockedBy(activeUnlock.type),
      expiresAt: activeUnlock.expiresAt,
      activeQuizUnlockId: activeUnlock.id,
    };
  }

  return {
    isUnlocked: false,
    unlockedBy: null,
    expiresAt: null,
    activeQuizUnlockId: null,
  };
}
