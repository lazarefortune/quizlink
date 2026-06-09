import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

type DbClient = Prisma.TransactionClient | NonNullable<typeof prisma>;

export const eligibleAttemptDetailsWhere = {
  OR: [
    { participantName: { not: null } },
    { participantEmail: { not: null } },
    { answers: { some: {} } },
  ],
} satisfies Prisma.QuizAttemptWhereInput;

export type PurgeQuizLinkDetailsResult = {
  answersDeleted: number;
  attemptsAnonymized: number;
  participantNamesCleared: number;
  participantEmailsCleared: number;
  detailsPurgedAt: Date | null;
};

export async function findEligibleAttemptIdsForQuizLink(
  quizLinkId: string,
  db: DbClient = prisma,
): Promise<string[]> {
  const attempts = await db.quizAttempt.findMany({
    where: {
      quizLinkId,
      ...eligibleAttemptDetailsWhere,
    },
    select: { id: true },
  });

  return attempts.map((attempt) => attempt.id);
}

/**
 * Purges detailed responses for one quiz link inside a transaction.
 * Never deletes QuizAttempt rows or touches aggregate tables.
 */
export async function purgeQuizLinkDetailedResponses(
  quizLinkId: string,
  attemptIds: string[],
  now: Date,
  db: DbClient = prisma,
): Promise<PurgeQuizLinkDetailsResult> {
  if (attemptIds.length === 0) {
    return {
      answersDeleted: 0,
      attemptsAnonymized: 0,
      participantNamesCleared: 0,
      participantEmailsCleared: 0,
      detailsPurgedAt: null,
    };
  }

  const run = async (tx: Prisma.TransactionClient): Promise<PurgeQuizLinkDetailsResult> => {
    const participantNamesCleared = await tx.quizAttempt.count({
      where: {
        id: { in: attemptIds },
        participantName: { not: null },
      },
    });

    const participantEmailsCleared = await tx.quizAttempt.count({
      where: {
        id: { in: attemptIds },
        participantEmail: { not: null },
      },
    });

    const deletedAnswers = await tx.quizAnswer.deleteMany({
      where: { attemptId: { in: attemptIds } },
    });

    const anonymizedAttempts = await tx.quizAttempt.updateMany({
      where: { id: { in: attemptIds } },
      data: {
        participantName: null,
        participantEmail: null,
      },
    });

    const purgedLink = await tx.quizLink.updateMany({
      where: {
        id: quizLinkId,
        detailsPurgedAt: null,
      },
      data: {
        detailsPurgedAt: now,
      },
    });

    return {
      answersDeleted: deletedAnswers.count,
      attemptsAnonymized: anonymizedAttempts.count,
      participantNamesCleared,
      participantEmailsCleared,
      detailsPurgedAt: purgedLink.count > 0 ? now : null,
    };
  };

  if ("$transaction" in db && typeof db.$transaction === "function") {
    return db.$transaction(run);
  }

  return run(db as Prisma.TransactionClient);
}
