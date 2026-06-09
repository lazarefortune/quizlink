import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type DbClient = Prisma.TransactionClient | NonNullable<typeof prisma>;

function resolveClient(db?: DbClient): DbClient {
  const client = db ?? prisma;
  if (!client) {
    throw new Error("Database not initialized");
  }
  return client;
}

export type QuestionAnswerAggregateInput = {
  questionId: string;
  isCorrect: boolean;
  expired: boolean;
  timeSpentSeconds: number | null;
};

export type QuizCompletedAggregateInput = {
  score: number;
  totalQuestions: number;
  durationSeconds: number | null;
};

export type QuizResponseAggregatesSnapshot = {
  quizId: string;
  totalStarted: number;
  totalCompleted: number;
  totalAbandoned: number;
  averageScorePercent: number | null;
  averageDurationSeconds: number | null;
  completionRatePercent: number;
};

/**
 * Increments global started count when a real QuizAttempt is created.
 * Preview flows must never call this.
 */
export async function incrementQuizStartedAggregate(
  quizId: string,
  db?: DbClient,
): Promise<void> {
  const client = resolveClient(db);

  await client.quizResponseStats.upsert({
    where: { quizId },
    create: {
      quizId,
      totalStarted: 1,
    },
    update: {
      totalStarted: { increment: 1 },
    },
  });
}

/**
 * Increments global completed stats. Call only after a successful IN_PROGRESS → COMPLETED transition.
 */
export async function incrementQuizCompletedAggregate(
  quizId: string,
  input: QuizCompletedAggregateInput,
  db?: DbClient,
): Promise<void> {
  const client = resolveClient(db);

  const correctAnswers =
    input.totalQuestions > 0 ? (input.score / 100) * input.totalQuestions : 0;

  await client.quizResponseStats.upsert({
    where: { quizId },
    create: {
      quizId,
      totalCompleted: 1,
      totalScore: correctAnswers,
      totalPossibleScore: input.totalQuestions,
      totalDurationSeconds: input.durationSeconds ?? 0,
      completedDurationCount: input.durationSeconds != null ? 1 : 0,
    },
    update: {
      totalCompleted: { increment: 1 },
      totalScore: { increment: correctAnswers },
      totalPossibleScore: { increment: input.totalQuestions },
      ...(input.durationSeconds != null
        ? {
            totalDurationSeconds: { increment: input.durationSeconds },
            completedDurationCount: { increment: 1 },
          }
        : {}),
    },
  });
}

/**
 * Increments global abandoned count. Call only after a successful IN_PROGRESS → ABANDONED transition.
 */
export async function incrementQuizAbandonedAggregate(
  quizId: string,
  db?: DbClient,
): Promise<void> {
  const client = resolveClient(db);

  await client.quizResponseStats.upsert({
    where: { quizId },
    create: {
      quizId,
      totalAbandoned: 1,
    },
    update: {
      totalAbandoned: { increment: 1 },
    },
  });
}

/**
 * Increments per-question stats for each answer in a newly completed attempt.
 */
export async function incrementQuestionAnswerAggregates(
  quizId: string,
  answers: QuestionAnswerAggregateInput[],
  db?: DbClient,
): Promise<void> {
  const client = resolveClient(db);

  for (const answer of answers) {
    const hasTimeSpent = answer.timeSpentSeconds != null;

    await client.quizQuestionResponseStats.upsert({
      where: {
        quizId_questionId: {
          quizId,
          questionId: answer.questionId,
        },
      },
      create: {
        quizId,
        questionId: answer.questionId,
        totalAnswers: 1,
        correctAnswers: answer.isCorrect ? 1 : 0,
        expiredAnswers: answer.expired ? 1 : 0,
        totalTimeSpentSeconds: answer.timeSpentSeconds ?? 0,
        timeSpentCount: hasTimeSpent ? 1 : 0,
      },
      update: {
        totalAnswers: { increment: 1 },
        ...(answer.isCorrect ? { correctAnswers: { increment: 1 } } : {}),
        ...(answer.expired ? { expiredAnswers: { increment: 1 } } : {}),
        ...(hasTimeSpent
          ? {
              totalTimeSpentSeconds: { increment: answer.timeSpentSeconds as number },
              timeSpentCount: { increment: 1 },
            }
          : {}),
      },
    });
  }
}

/**
 * Reads persisted quiz-level aggregates for dashboard KPIs.
 * Returns null when no row exists yet.
 */
export async function getQuizResponseAggregates(
  quizId: string,
  db?: DbClient,
): Promise<QuizResponseAggregatesSnapshot | null> {
  const client = resolveClient(db);

  const row = await client.quizResponseStats.findUnique({
    where: { quizId },
  });

  if (!row) {
    return null;
  }

  const averageScorePercent =
    row.totalPossibleScore > 0
      ? (row.totalScore / row.totalPossibleScore) * 100
      : null;

  const averageDurationSeconds =
    row.completedDurationCount > 0
      ? row.totalDurationSeconds / row.completedDurationCount
      : null;

  const completionRatePercent =
    row.totalStarted > 0 ? (row.totalCompleted / row.totalStarted) * 100 : 0;

  return {
    quizId: row.quizId,
    totalStarted: row.totalStarted,
    totalCompleted: row.totalCompleted,
    totalAbandoned: row.totalAbandoned,
    averageScorePercent,
    averageDurationSeconds,
    completionRatePercent,
  };
}

/**
 * Attempts IN_PROGRESS → COMPLETED. Returns true only when the transition happened.
 */
export async function transitionAttemptToCompleted(
  attemptId: string,
  data: {
    finishedAt: Date;
    score: number;
    durationSeconds: number | null;
    totalQuestions: number | null;
  },
  db?: DbClient,
): Promise<boolean> {
  const client = resolveClient(db);

  const result = await client.quizAttempt.updateMany({
    where: { id: attemptId, status: "IN_PROGRESS" },
    data: {
      status: "COMPLETED",
      finishedAt: data.finishedAt,
      score: data.score,
      durationSeconds: data.durationSeconds,
      totalQuestions: data.totalQuestions,
    },
  });

  return result.count > 0;
}

/**
 * Attempts IN_PROGRESS → ABANDONED. Returns true only when the transition happened.
 */
export async function transitionAttemptToAbandoned(
  attemptId: string,
  data: {
    finishedAt: Date;
    durationSeconds: number;
  },
  db?: DbClient,
): Promise<boolean> {
  const client = resolveClient(db);

  const result = await client.quizAttempt.updateMany({
    where: { id: attemptId, status: "IN_PROGRESS" },
    data: {
      status: "ABANDONED",
      finishedAt: data.finishedAt,
      durationSeconds: data.durationSeconds,
    },
  });

  return result.count > 0;
}
