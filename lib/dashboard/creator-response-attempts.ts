import type { Prisma } from "@prisma/client";

/**
 * Quiz attempts visible in the creator "Responses" section.
 * Includes anonymous public plays and identified participant plays.
 * Preview does not create QuizAttempt rows, so nothing to exclude here.
 */
export function buildCreatorResponseAttemptWhere(
  quizId: string,
): Prisma.QuizAttemptWhereInput {
  return {
    quizLink: { quizId },
    OR: [{ identityMode: "ANONYMOUS" }, { participantId: { not: null } }],
  };
}

export type CreatorResponseAttemptRecord = {
  id: string;
  participantId: string | null;
  identityMode: string;
  score: number | null;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  durationSeconds: number | null;
  totalQuestions: number | null;
  participant: { name: string } | null;
  answers: Array<{ id: string }>;
};

export type QuizDetailAttemptRow = {
  id: string;
  participantLabel: string;
  anonymousNumber: number | null;
  isAnonymous: boolean;
  score: number | null;
  durationSeconds: number | null;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  questionsAnswered: number;
  totalQuestions: number | null;
};

export function buildAnonymousAttemptIndexMap(
  attempts: Array<{ id: string; startedAt: Date }>,
): Map<string, number> {
  const sorted = [...attempts].sort(
    (a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
  );
  return new Map(sorted.map((attempt, index) => [attempt.id, index + 1]));
}

export function formatAnonymousParticipantLabel(index: number): string {
  return `Participant anonyme #${index}`;
}

export function resolveAttemptDurationSeconds(attempt: {
  durationSeconds: number | null;
  startedAt: Date;
  finishedAt: Date | null;
}): number | null {
  if (attempt.durationSeconds != null && attempt.durationSeconds > 0) {
    return attempt.durationSeconds;
  }
  if (!attempt.finishedAt) {
    return null;
  }
  const seconds = Math.floor(
    (attempt.finishedAt.getTime() - attempt.startedAt.getTime()) / 1000,
  );
  return seconds > 0 ? seconds : null;
}

export function computeCreatorResponseStats(attempts: CreatorResponseAttemptRecord[]): {
  totalStarted: number;
  completedCount: number;
  abandonedCount: number;
  anonymousCompletedCount: number;
  identifiedCompletedCount: number;
  averageScore: number;
  scoredCount: number;
  averageDurationSeconds: number | null;
  completionRatePercent: number;
  bestScore: number | null;
  lowestScore: number | null;
} {
  const completed = attempts.filter((a) => a.status === "COMPLETED");
  const abandonedCount = attempts.filter((a) => a.status === "ABANDONED").length;
  const anonymousCompleted = completed.filter((a) => a.identityMode === "ANONYMOUS");
  const identifiedCompleted = completed.filter((a) => a.participantId != null);

  const scored = completed.filter(
    (a) => a.score != null && Number.isFinite(a.score),
  );
  const scoreSum = scored.reduce((sum, a) => sum + (a.score as number), 0);

  const durations = completed
    .map(resolveAttemptDurationSeconds)
    .filter((value): value is number => value != null && value > 0);
  const averageDurationSeconds =
    durations.length > 0
      ? durations.reduce((sum, value) => sum + value, 0) / durations.length
      : null;

  const completionRatePercent =
    attempts.length > 0 ? (completed.length / attempts.length) * 100 : 0;

  const bestScore =
    scored.length > 0 ? Math.max(...scored.map((a) => a.score as number)) : null;
  const lowestScore =
    scored.length > 0 ? Math.min(...scored.map((a) => a.score as number)) : null;

  return {
    totalStarted: attempts.length,
    completedCount: completed.length,
    abandonedCount,
    anonymousCompletedCount: anonymousCompleted.length,
    identifiedCompletedCount: identifiedCompleted.length,
    averageScore: scored.length > 0 ? scoreSum / scored.length : 0,
    scoredCount: scored.length,
    averageDurationSeconds,
    completionRatePercent,
    bestScore,
    lowestScore,
  };
}

export function mapAttemptsToDetailRows(
  attempts: CreatorResponseAttemptRecord[],
): QuizDetailAttemptRow[] {
  const anonymousAttempts = attempts.filter((a) => a.identityMode === "ANONYMOUS");
  const anonymousIndexMap = buildAnonymousAttemptIndexMap(anonymousAttempts);

  return attempts
    .map((attempt) => {
      const isAnonymous = attempt.identityMode === "ANONYMOUS";
      const anonymousIndex = anonymousIndexMap.get(attempt.id);
      const anonymousNumber = isAnonymous ? (anonymousIndex ?? null) : null;
      const participantLabel = isAnonymous
        ? formatAnonymousParticipantLabel(anonymousIndex ?? 0)
        : (attempt.participant?.name ?? "");

      return {
        id: attempt.id,
        participantLabel,
        anonymousNumber,
        isAnonymous,
        score: attempt.score,
        durationSeconds: resolveAttemptDurationSeconds(attempt),
        status: attempt.status,
        startedAt: attempt.startedAt,
        finishedAt: attempt.finishedAt,
        questionsAnswered: attempt.answers.length,
        totalQuestions: attempt.totalQuestions,
      };
    })
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
}
