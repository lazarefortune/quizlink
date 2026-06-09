import { prisma } from "@/lib/prisma";

import { getActiveUserSubscriptionAccess } from "./getActiveUserSubscriptionAccess";
import {
  resolveQuizLinkExpirationStatus,
  type QuizLinkExpirationStatus,
} from "./quizLinkExpirationStatus";

type LinkRow = {
  quizId: string;
  responsesStartedAt: Date | null;
  acceptingResponsesUntil: Date | null;
  detailsVisibleUntil: Date | null;
  unlockedUntil: Date | null;
};

/**
 * Batch expiration status for dashboard quiz list cards.
 */
export async function batchResolveQuizExpirationStatusForOwner(
  userId: string,
  quizIds: string[],
  now: Date = new Date(),
): Promise<Map<string, QuizLinkExpirationStatus>> {
  const result = new Map<string, QuizLinkExpirationStatus>();

  if (quizIds.length === 0 || !prisma) {
    return result;
  }

  const uniqueQuizIds = [...new Set(quizIds)];

  const subscription = await getActiveUserSubscriptionAccess(userId);

  const links = await prisma.quizLink.findMany({
    where: {
      quizId: { in: uniqueQuizIds },
      participantId: null,
    },
    select: {
      quizId: true,
      responsesStartedAt: true,
      acceptingResponsesUntil: true,
      detailsVisibleUntil: true,
      unlockedUntil: true,
    },
  });

  const linkByQuizId = new Map<string, LinkRow>(
    links.map((link) => [link.quizId, link]),
  );

  if (subscription.isActive) {
    for (const quizId of uniqueQuizIds) {
      const link = linkByQuizId.get(quizId) ?? null;
      result.set(
        quizId,
        resolveQuizLinkExpirationStatus({
          link,
          access: {
            isUnlocked: true,
            unlockedBy: "SUBSCRIPTION",
            expiresAt: subscription.expiresAt,
            activeQuizUnlockId: null,
          },
          now,
        }),
      );
    }
    return result;
  }

  const unlockRows = await prisma.quizUnlock.findMany({
    where: {
      quizId: { in: uniqueQuizIds },
      userId,
      expiresAt: { gt: now },
    },
    orderBy: { expiresAt: "desc" },
    select: {
      id: true,
      quizId: true,
      type: true,
      expiresAt: true,
    },
  });

  const unlockByQuizId = new Map<
    string,
    { id: string; type: string; expiresAt: Date }
  >();
  for (const row of unlockRows) {
    if (!unlockByQuizId.has(row.quizId)) {
      unlockByQuizId.set(row.quizId, row);
    }
  }

  for (const quizId of uniqueQuizIds) {
    const link = linkByQuizId.get(quizId) ?? null;
    const unlock = unlockByQuizId.get(quizId);

    const access = unlock
      ? {
          isUnlocked: true,
          unlockedBy:
            unlock.type === "SUBSCRIPTION"
              ? ("SUBSCRIPTION" as const)
              : unlock.type === "ADMIN"
                ? ("ADMIN" as const)
                : ("QUIZ_UNLOCK" as const),
          expiresAt: unlock.expiresAt,
          activeQuizUnlockId: unlock.id,
        }
      : {
          isUnlocked: false,
          unlockedBy: null,
          expiresAt: null,
          activeQuizUnlockId: null,
        };

    result.set(
      quizId,
      resolveQuizLinkExpirationStatus({ link, access, now }),
    );
  }

  return result;
}
