import type { QuizUnlockType } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

import { batchResolveQuizCompletedCounts } from "./batchResolveQuizCompletedCounts";
import { getActiveUserSubscriptionAccess } from "./getActiveUserSubscriptionAccess";
import {
  resolveQuizResponseQuotaStatus,
  type QuizResponseQuotaStatus,
  type QuizResponseQuotaUnlockedBy,
} from "./quizResponseQuotaStatus";

function mapUnlockTypeToUnlockedBy(type: QuizUnlockType): QuizResponseQuotaUnlockedBy {
  if (type === "SUBSCRIPTION") {
    return "SUBSCRIPTION";
  }
  if (type === "ADMIN") {
    return "ADMIN";
  }
  return "COINS";
}

/**
 * Batch quota status for dashboard quiz list cards.
 * Does not use expiration dates or quizLinkExpirationStatus.
 */
export async function batchResolveQuizQuotaStatusForOwner(
  ownerId: string,
  quizIds: string[],
  now: Date = new Date(),
): Promise<Map<string, QuizResponseQuotaStatus>> {
  const result = new Map<string, QuizResponseQuotaStatus>();

  if (quizIds.length === 0 || !prisma) {
    return result;
  }

  const uniqueQuizIds = [...new Set(quizIds)];

  const [completedCountByQuizId, subscription] = await Promise.all([
    batchResolveQuizCompletedCounts(uniqueQuizIds),
    getActiveUserSubscriptionAccess(ownerId),
  ]);

  if (subscription.isActive) {
    for (const quizId of uniqueQuizIds) {
      result.set(
        quizId,
        resolveQuizResponseQuotaStatus({
          completedResponses: completedCountByQuizId.get(quizId) ?? 0,
          isProActive: true,
          isQuizUnlockedWithCoins: false,
          unlockedBy: "SUBSCRIPTION",
        }),
      );
    }
    return result;
  }

  const unlockRows = await prisma.quizUnlock.findMany({
    where: {
      quizId: { in: uniqueQuizIds },
      userId: ownerId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: [{ expiresAt: "desc" }, { createdAt: "desc" }],
    select: {
      quizId: true,
      type: true,
    },
  });

  const unlockByQuizId = new Map<string, { type: QuizUnlockType }>();
  for (const row of unlockRows) {
    if (!unlockByQuizId.has(row.quizId)) {
      unlockByQuizId.set(row.quizId, row);
    }
  }

  for (const quizId of uniqueQuizIds) {
    const unlock = unlockByQuizId.get(quizId);
    const completedResponses = completedCountByQuizId.get(quizId) ?? 0;

    if (unlock != null) {
      result.set(
        quizId,
        resolveQuizResponseQuotaStatus({
          completedResponses,
          isProActive: false,
          isQuizUnlockedWithCoins: true,
          unlockedBy: mapUnlockTypeToUnlockedBy(unlock.type),
        }),
      );
      continue;
    }

    result.set(
      quizId,
      resolveQuizResponseQuotaStatus({
        completedResponses,
        isProActive: false,
        isQuizUnlockedWithCoins: false,
      }),
    );
  }

  return result;
}
