import type { Prisma } from "@/generated/prisma/client";

export type ApplyQuizUnlockToQuizLinksParams = {
  quizId: string;
  expiresAt: Date;
  db: Prisma.TransactionClient;
};

/**
 * Extends campaign windows on all links for a quiz when the owner unlocks it.
 */
export async function applyQuizUnlockToQuizLinks({
  quizId,
  expiresAt,
  db,
}: ApplyQuizUnlockToQuizLinksParams): Promise<void> {
  await db.quizLink.updateMany({
    where: { quizId },
    data: {
      unlockedUntil: expiresAt,
      acceptingResponsesUntil: expiresAt,
      detailsVisibleUntil: expiresAt,
    },
  });
}
