import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PARTICIPANT_IDENTITY_MODES } from "@/types/participant-identity";

type DbClient = Pick<typeof prisma, "quizResponseStats" | "quizAttempt">;

/**
 * Completed response counts for quiz list cards — aligned with dashboard KPIs.
 * Prefers `quiz_response_stats.totalCompleted`, falls back to creator-visible attempts.
 */
export async function batchResolveQuizCompletedCounts(
  quizIds: string[],
  db: DbClient = prisma,
): Promise<Map<string, number>> {
  const result = new Map<string, number>();

  if (quizIds.length === 0) {
    return result;
  }

  const uniqueQuizIds = [...new Set(quizIds)];

  const [aggregateRows, completedAttempts] = await Promise.all([
    db.quizResponseStats.findMany({
      where: { quizId: { in: uniqueQuizIds } },
      select: { quizId: true, totalCompleted: true },
    }),
    db.quizAttempt.findMany({
      where: {
        status: "COMPLETED",
        quizLink: { quizId: { in: uniqueQuizIds } },
        OR: [
          {
            participantId: null,
            identityMode: { in: [...PARTICIPANT_IDENTITY_MODES] },
          },
          { participantId: { not: null } },
        ],
      } satisfies Prisma.QuizAttemptWhereInput,
      select: {
        quizLink: { select: { quizId: true } },
      },
    }),
  ]);

  for (const row of aggregateRows) {
    result.set(row.quizId, row.totalCompleted);
  }

  const aggregateQuizIds = new Set(aggregateRows.map((row) => row.quizId));

  for (const attempt of completedAttempts) {
    const quizId = attempt.quizLink.quizId;
    if (aggregateQuizIds.has(quizId)) {
      continue;
    }
    result.set(quizId, (result.get(quizId) ?? 0) + 1);
  }

  for (const quizId of uniqueQuizIds) {
    if (!result.has(quizId)) {
      result.set(quizId, 0);
    }
  }

  return result;
}
