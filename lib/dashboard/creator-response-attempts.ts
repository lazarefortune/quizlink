import type { Prisma } from "@prisma/client";

import { PARTICIPANT_IDENTITY_MODES } from "@/types/participant-identity";

export const ATTEMPT_DETAILS_ERROR = {
  LOCKED: "ATTEMPT_DETAILS_LOCKED",
  PURGED: "ATTEMPT_DETAILS_PURGED",
} as const;

export function resolveAttemptDetailsPurged(
  detailsPurgedAt: Date | null,
  answerCount: number,
): boolean {
  return detailsPurgedAt != null && answerCount === 0;
}

/** Placeholder row ids — never real attempt ids. */
export function buildLockedPlaceholderRowKeys(
  lockedCount: number,
  maxRows = 5,
): string[] {
  const rowCount = Math.min(lockedCount, maxRows);
  return Array.from({ length: rowCount }, (_, index) => `locked-placeholder-${index}`);
}

export function computeLockedAttemptCount(
  totalAttemptCount: number,
  visibleAttemptCount: number,
  isUnlocked: boolean,
): number {
  if (isUnlocked) {
    return 0;
  }
  return Math.max(0, totalAttemptCount - visibleAttemptCount);
}

/**
 * Quiz attempts visible in the creator "Responses" section.
 * Includes public plays (anonymous / pseudonym / name+email) and identified participant plays.
 * Preview does not create QuizAttempt rows, so nothing to exclude here.
 */
export function buildCreatorResponseAttemptWhere(
  quizId: string,
): Prisma.QuizAttemptWhereInput {
  return {
    quizLink: { quizId },
    OR: [
      {
        participantId: null,
        identityMode: { in: [...PARTICIPANT_IDENTITY_MODES] },
      },
      { participantId: { not: null } },
    ],
  };
}

export type CreatorResponseAttemptRecord = {
  id: string;
  participantId: string | null;
  identityMode: string;
  participantName: string | null;
  participantEmail: string | null;
  score: number | null;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  durationSeconds: number | null;
  totalQuestions: number | null;
  participant: { name: string } | null;
  questionsAnswered: number;
  quizLinkDetailsPurgedAt: Date | null;
};

export const creatorResponseAttemptListSelect = {
  id: true,
  participantId: true,
  identityMode: true,
  participantName: true,
  participantEmail: true,
  score: true,
  status: true,
  startedAt: true,
  finishedAt: true,
  durationSeconds: true,
  totalQuestions: true,
  participant: { select: { name: true } },
  quizLink: { select: { detailsPurgedAt: true } },
  _count: { select: { answers: true } },
} as const;

export function mapPrismaAttemptToCreatorRecord(
  row: {
    id: string;
    participantId: string | null;
    identityMode: string;
    participantName: string | null;
    participantEmail: string | null;
    score: number | null;
    status: string;
    startedAt: Date;
    finishedAt: Date | null;
    durationSeconds: number | null;
    totalQuestions: number | null;
    participant: { name: string } | null;
    quizLink: { detailsPurgedAt: Date | null };
    _count: { answers: number };
  },
): CreatorResponseAttemptRecord {
  return {
    id: row.id,
    participantId: row.participantId,
    identityMode: row.identityMode,
    participantName: row.participantName,
    participantEmail: row.participantEmail,
    score: row.score,
    status: row.status,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    durationSeconds: row.durationSeconds,
    totalQuestions: row.totalQuestions,
    participant: row.participant,
    questionsAnswered: row._count.answers,
    quizLinkDetailsPurgedAt: row.quizLink.detailsPurgedAt,
  };
}

export type QuizDetailAttemptRow = {
  id: string;
  participantLabel: string;
  participantEmailHint: string | null;
  anonymousNumber: number | null;
  isAnonymous: boolean;
  score: number | null;
  durationSeconds: number | null;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  questionsAnswered: number;
  totalQuestions: number | null;
  detailsPurged: boolean;
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
  anonymousIndexMapInput?: Map<string, number>,
): QuizDetailAttemptRow[] {
  const anonymousAttempts = attempts.filter((a) => a.identityMode === "ANONYMOUS");
  const anonymousIndexMap =
    anonymousIndexMapInput ??
    buildAnonymousAttemptIndexMap(
      anonymousAttempts.map((attempt) => ({
        id: attempt.id,
        startedAt: attempt.startedAt,
      })),
    );

  return attempts
    .map((attempt) => {
      const isAnonymous = attempt.identityMode === "ANONYMOUS";
      const anonymousIndex = anonymousIndexMap.get(attempt.id);
      const anonymousNumber = isAnonymous ? (anonymousIndex ?? null) : null;

      let participantLabel: string;
      let participantEmailHint: string | null = null;

      if (isAnonymous) {
        participantLabel = formatAnonymousParticipantLabel(anonymousIndex ?? 0);
      } else if (attempt.participantId != null) {
        participantLabel = attempt.participant?.name ?? "";
      } else if (attempt.identityMode === "NAME_EMAIL") {
        participantLabel = attempt.participantName?.trim() || "—";
        participantEmailHint = attempt.participantEmail?.trim() || null;
      } else {
        participantLabel = attempt.participantName?.trim() || "—";
      }

      return {
        id: attempt.id,
        participantLabel,
        participantEmailHint,
        anonymousNumber,
        isAnonymous,
        score: attempt.score,
        durationSeconds: resolveAttemptDurationSeconds(attempt),
        status: attempt.status,
        startedAt: attempt.startedAt,
        finishedAt: attempt.finishedAt,
        questionsAnswered: attempt.questionsAnswered,
        totalQuestions: attempt.totalQuestions,
        detailsPurged: resolveAttemptDetailsPurged(
          attempt.quizLinkDetailsPurgedAt,
          attempt.questionsAnswered,
        ),
      };
    })
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
}
