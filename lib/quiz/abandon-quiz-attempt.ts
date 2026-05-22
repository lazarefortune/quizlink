import { prisma } from "@/lib/prisma";

export type AbandonQuizAttemptResult =
  | { success: true; alreadyFinalized: boolean }
  | { success: false; error: string };

export function computeAbandonDurationSeconds(
  startedAt: Date,
  finishedAt: Date,
): number {
  return Math.max(
    0,
    Math.floor((finishedAt.getTime() - startedAt.getTime()) / 1000),
  );
}

/**
 * Marks an in-progress attempt as ABANDONED. Idempotent for COMPLETED / ABANDONED.
 */
export async function abandonQuizAttemptById(
  attemptId: string,
): Promise<AbandonQuizAttemptResult> {
  if (!prisma) {
    return { success: false, error: "Database not initialized" };
  }

  const trimmed = attemptId?.trim();
  if (!trimmed) {
    return { success: false, error: "Invalid attempt id" };
  }

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: trimmed },
    select: { id: true, status: true, startedAt: true },
  });

  if (!attempt) {
    return { success: false, error: "Attempt not found" };
  }

  if (attempt.status === "COMPLETED" || attempt.status === "ABANDONED") {
    return { success: true, alreadyFinalized: true };
  }

  if (attempt.status !== "IN_PROGRESS") {
    return { success: false, error: "Attempt cannot be abandoned" };
  }

  const finishedAt = new Date();
  const durationSeconds = computeAbandonDurationSeconds(attempt.startedAt, finishedAt);

  await prisma.quizAttempt.update({
    where: { id: trimmed },
    data: {
      status: "ABANDONED",
      finishedAt,
      durationSeconds,
    },
  });

  return { success: true, alreadyFinalized: false };
}
