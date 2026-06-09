/**
 * [ONE-SHOT — backfill] Reconstruit `quiz_response_stats` et `quiz_question_response_stats`
 * depuis l'historique des `QuizAttempt` / `QuizAnswer`.
 *
 * Le runtime live alimente déjà les agrégats pour les nouvelles parties ; ce script sert
 * à aligner l'historique avant bascule dashboard / purge future.
 *
 * Usage :
 *   pnpm tsx scripts/backfill-quiz-response-aggregates.ts --dry-run
 *   pnpm tsx scripts/backfill-quiz-response-aggregates.ts --apply
 *   pnpm tsx scripts/backfill-quiz-response-aggregates.ts --dry-run --quizId=quiz_abc
 *   pnpm tsx scripts/backfill-quiz-response-aggregates.ts --apply --batchSize=50
 */
import { pathToFileURL } from "node:url";

import type { Prisma } from "@/generated/prisma/client";

import {
  buildQuizAggregatesFromHistory,
  type BuiltQuizAggregatesFromHistory,
  type HistoricalAnswerInput,
  type HistoricalAttemptInput,
} from "../lib/quiz/buildQuizResponseAggregatesFromHistory";
import { prisma } from "../lib/prisma";

const DEFAULT_BATCH_SIZE = 100;

export type BackfillQuizResponseAggregatesOptions = {
  dryRun: boolean;
  apply: boolean;
  quizId?: string;
  batchSize: number;
};

export type BackfillQuizSummary = {
  quizId: string;
  attemptCount: number;
  completedAttemptCount: number;
  answerCount: number;
  questionStatsCount: number;
  hasResponseStats: boolean;
};

export type BackfillRunSummary = {
  mode: "dry-run" | "apply";
  quizzesProcessed: number;
  attemptsProcessed: number;
  answersProcessed: number;
  questionStatsWritten: number;
  responseStatsWritten: number;
  durationMs: number;
  quizSummaries: BackfillQuizSummary[];
};

export function parseBackfillQuizResponseAggregatesOptions(
  argv: string[],
): BackfillQuizResponseAggregatesOptions {
  const dryRun = argv.includes("--dry-run");
  const apply = argv.includes("--apply");

  const quizIdArg = argv.find((arg) => arg.startsWith("--quizId="));
  const quizId = quizIdArg?.slice("--quizId=".length).trim() || undefined;

  const batchSizeArg = argv.find((arg) => arg.startsWith("--batchSize="));
  const parsedBatchSize = batchSizeArg
    ? Number.parseInt(batchSizeArg.slice("--batchSize=".length), 10)
    : DEFAULT_BATCH_SIZE;
  const batchSize =
    Number.isFinite(parsedBatchSize) && parsedBatchSize > 0
      ? parsedBatchSize
      : DEFAULT_BATCH_SIZE;

  return { dryRun, apply, quizId, batchSize };
}

export function printBackfillUsage(): void {
  console.log(`Usage:
  pnpm tsx scripts/backfill-quiz-response-aggregates.ts --dry-run [--quizId=xxx] [--batchSize=100]
  pnpm tsx scripts/backfill-quiz-response-aggregates.ts --apply [--quizId=xxx] [--batchSize=100]

Options:
  --dry-run     Calcule et affiche le plan sans écrire en base
  --apply       Écrit réellement les agrégats recalculés
  --quizId=xxx  Limite le backfill à un quiz
  --batchSize=N Nombre de quiz traités par page (défaut: ${DEFAULT_BATCH_SIZE})`);
}

async function fetchQuizIdsPage(params: {
  quizId?: string;
  batchSize: number;
  cursor?: string;
}): Promise<string[]> {
  if (params.quizId) {
    return [params.quizId];
  }

  const rows = await prisma.quiz.findMany({
    where: {
      links: {
        some: {
          attempts: {
            some: {},
          },
        },
      },
      ...(params.cursor
        ? {
            id: {
              gt: params.cursor,
            },
          }
        : {}),
    },
    select: { id: true },
    orderBy: { id: "asc" },
    take: params.batchSize,
  });

  return rows.map((row) => row.id);
}

async function loadHistoricalAttemptsForQuiz(
  quizId: string,
): Promise<HistoricalAttemptInput[]> {
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quizLink: { quizId },
    },
    select: {
      id: true,
      status: true,
      score: true,
      totalQuestions: true,
      durationSeconds: true,
      _count: {
        select: { answers: true },
      },
    },
  });

  return attempts.map((attempt) => ({
    id: attempt.id,
    status: attempt.status,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    durationSeconds: attempt.durationSeconds,
    answerCount: attempt._count.answers,
  }));
}

async function loadHistoricalAnswersForCompletedAttempts(
  quizId: string,
): Promise<HistoricalAnswerInput[]> {
  const answers = await prisma.quizAnswer.findMany({
    where: {
      attempt: {
        status: "COMPLETED",
        quizLink: { quizId },
      },
    },
    select: {
      questionId: true,
      isCorrect: true,
      expired: true,
      timeSpent: true,
    },
  });

  return answers.map((answer) => ({
    questionId: answer.questionId,
    isCorrect: answer.isCorrect,
    expired: answer.expired,
    timeSpentSeconds: answer.timeSpent,
  }));
}

export function summarizeBuiltAggregates(
  quizId: string,
  attempts: HistoricalAttemptInput[],
  answers: HistoricalAnswerInput[],
  built: BuiltQuizAggregatesFromHistory,
): BackfillQuizSummary {
  return {
    quizId,
    attemptCount: attempts.length,
    completedAttemptCount: attempts.filter((attempt) => attempt.status === "COMPLETED").length,
    answerCount: answers.length,
    questionStatsCount: built.questionStats.length,
    hasResponseStats: built.responseStats != null,
  };
}

export async function applyQuizAggregatesBackfill(
  built: BuiltQuizAggregatesFromHistory,
  db: Prisma.TransactionClient = prisma,
): Promise<void> {
  await db.quizResponseStats.deleteMany({
    where: { quizId: built.quizId },
  });
  await db.quizQuestionResponseStats.deleteMany({
    where: { quizId: built.quizId },
  });

  if (built.responseStats) {
    await db.quizResponseStats.create({
      data: {
        quizId: built.responseStats.quizId,
        totalStarted: built.responseStats.totalStarted,
        totalCompleted: built.responseStats.totalCompleted,
        totalAbandoned: built.responseStats.totalAbandoned,
        totalScore: built.responseStats.totalScore,
        totalPossibleScore: built.responseStats.totalPossibleScore,
        totalDurationSeconds: built.responseStats.totalDurationSeconds,
        completedDurationCount: built.responseStats.completedDurationCount,
      },
    });
  }

  if (built.questionStats.length > 0) {
    await db.quizQuestionResponseStats.createMany({
      data: built.questionStats.map((row) => ({
        quizId: row.quizId,
        questionId: row.questionId,
        totalAnswers: row.totalAnswers,
        correctAnswers: row.correctAnswers,
        expiredAnswers: row.expiredAnswers,
        totalTimeSpentSeconds: row.totalTimeSpentSeconds,
        timeSpentCount: row.timeSpentCount,
      })),
    });
  }
}

export async function backfillQuizResponseAggregates(
  options: BackfillQuizResponseAggregatesOptions,
): Promise<BackfillRunSummary> {
  const startedAt = Date.now();
  const quizSummaries: BackfillQuizSummary[] = [];
  let quizzesProcessed = 0;
  let attemptsProcessed = 0;
  let answersProcessed = 0;
  let questionStatsWritten = 0;
  let responseStatsWritten = 0;

  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const quizIds = await fetchQuizIdsPage({
      quizId: options.quizId,
      batchSize: options.batchSize,
      cursor,
    });

    if (quizIds.length === 0) {
      break;
    }

    for (const quizId of quizIds) {
      const [attempts, answers] = await Promise.all([
        loadHistoricalAttemptsForQuiz(quizId),
        loadHistoricalAnswersForCompletedAttempts(quizId),
      ]);

      const built = buildQuizAggregatesFromHistory({
        quizId,
        attempts,
        answersFromCompletedAttempts: answers,
      });

      const summary = summarizeBuiltAggregates(quizId, attempts, answers, built);
      quizSummaries.push(summary);
      quizzesProcessed += 1;
      attemptsProcessed += summary.attemptCount;
      answersProcessed += summary.answerCount;

      if (options.apply) {
        await prisma.$transaction(async (tx) => {
          await applyQuizAggregatesBackfill(built, tx);
        });
      }

      if (summary.hasResponseStats) {
        responseStatsWritten += 1;
      }
      questionStatsWritten += summary.questionStatsCount;
    }

    if (options.quizId) {
      hasMore = false;
      continue;
    }

    cursor = quizIds[quizIds.length - 1];
    hasMore = quizIds.length === options.batchSize;
  }

  return {
    mode: options.apply ? "apply" : "dry-run",
    quizzesProcessed,
    attemptsProcessed,
    answersProcessed,
    questionStatsWritten,
    responseStatsWritten,
    durationMs: Date.now() - startedAt,
    quizSummaries,
  };
}

function printRunSummary(summary: BackfillRunSummary): void {
  console.log("=== Backfill quiz response aggregates ===");
  console.log(`Mode: ${summary.mode === "dry-run" ? "DRY RUN (aucune ecriture)" : "APPLY (ecriture active)"}`);
  console.log(`Quiz traites: ${summary.quizzesProcessed}`);
  console.log(`Parties prises en compte: ${summary.attemptsProcessed}`);
  console.log(`Reponses agrégées: ${summary.answersProcessed}`);
  console.log(`Lignes quiz_response_stats: ${summary.responseStatsWritten}`);
  console.log(`Lignes quiz_question_response_stats: ${summary.questionStatsWritten}`);
  console.log(`Duree: ${summary.durationMs}ms`);

  const topQuizzes = summary.quizSummaries
    .slice()
    .sort((left, right) => right.attemptCount - left.attemptCount)
    .slice(0, 10);

  if (topQuizzes.length > 0) {
    console.log("Top quiz (par nombre de parties):");
    for (const [index, row] of topQuizzes.entries()) {
      console.log(
        `${index + 1}. quizId=${row.quizId} | attempts=${row.attemptCount} | completed=${row.completedAttemptCount} | answers=${row.answerCount} | questionStats=${row.questionStatsCount}`,
      );
    }
  }
}

async function runCli(): Promise<void> {
  const options = parseBackfillQuizResponseAggregatesOptions(process.argv.slice(2));

  if (!options.dryRun && !options.apply) {
    console.error("Refus d'execution: fournissez --dry-run ou --apply.");
    printBackfillUsage();
    process.exit(1);
  }

  if (options.dryRun && options.apply) {
    console.error("Refus d'execution: --dry-run et --apply sont mutuellement exclusifs.");
    process.exit(1);
  }

  if (options.quizId) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: options.quizId },
      select: { id: true },
    });
    if (!quiz) {
      console.error(`Quiz introuvable: ${options.quizId}`);
      process.exit(1);
    }
  }

  const summary = await backfillQuizResponseAggregates(options);
  printRunSummary(summary);
}

const isDirectExecution =
  typeof process.argv[1] === "string" &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
  runCli()
    .catch((error) => {
      console.error("Erreur pendant le backfill des agrégats quiz:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
