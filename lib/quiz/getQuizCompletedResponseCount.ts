import { batchResolveQuizCompletedCounts } from "./batchResolveQuizCompletedCounts";

/**
 * Completed creator-visible responses for one quiz (COMPLETED only, not ABANDONED).
 * Prefers `quiz_response_stats.totalCompleted`, falls back to attempt count when missing.
 */
export async function getQuizCompletedResponseCount(quizId: string): Promise<number> {
  const counts = await batchResolveQuizCompletedCounts([quizId]);
  return counts.get(quizId) ?? 0;
}
