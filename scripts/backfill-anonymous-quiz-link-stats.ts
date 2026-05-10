/**
 * Script de maintenance / historique : reconstruit quiz_link_anonymous_stats à partir
 * d’anciennes lignes QuizAttempt (participantId null). À utiliser lors d’une migration
 * ou d’une réparation ponctuelle ; le runtime anonyme actuel alimente déjà les agrégats.
 */
import { pathToFileURL } from "node:url";

import { prisma } from "../lib/prisma";

type RawAnonymousQuizAttemptStatsRow = {
  quizLinkId: string;
  startedCount: bigint | number;
  completedCount: bigint | number;
  scoreSum: number | null;
  scoreCount: bigint | number;
  bestScore: number | null;
  lowestScore: number | null;
  lastStartedAt: Date | null;
  lastCompletedAt: Date | null;
};

type ExistingAnonymousStatsRow = {
  quizLinkId: string;
};

export type AnonymousQuizLinkBackfillStats = {
  quizLinkId: string;
  openCount: number;
  startedCount: number;
  completedCount: number;
  scoreSum: number;
  scoreCount: number;
  bestScore: number | null;
  lowestScore: number | null;
  lastOpenedAt: Date | null;
  lastStartedAt: Date | null;
  lastCompletedAt: Date | null;
};

export type BackfillPlan = {
  toCreate: AnonymousQuizLinkBackfillStats[];
  toOverwrite: AnonymousQuizLinkBackfillStats[];
  skippedExisting: AnonymousQuizLinkBackfillStats[];
};

export function mapRawRowToBackfillStats(
  row: RawAnonymousQuizAttemptStatsRow,
): AnonymousQuizLinkBackfillStats {
  const startedCount = Number(row.startedCount);
  const completedCount = Number(row.completedCount);
  const scoreCount = Number(row.scoreCount);
  const scoreSum = row.scoreSum ?? 0;

  return {
    quizLinkId: row.quizLinkId,
    openCount: startedCount,
    startedCount,
    completedCount,
    scoreSum,
    scoreCount,
    bestScore: row.bestScore,
    lowestScore: row.lowestScore,
    lastOpenedAt: row.lastStartedAt,
    lastStartedAt: row.lastStartedAt,
    lastCompletedAt: row.lastCompletedAt,
  };
}

function parseOptions(argv: string[]): {
  dryRun: boolean;
  confirm: boolean;
  overwrite: boolean;
} {
  return {
    dryRun: argv.includes("--dry-run"),
    confirm: argv.includes("--confirm"),
    overwrite: argv.includes("--overwrite"),
  };
}

function formatDate(value: Date | null): string {
  return value ? value.toISOString() : "-";
}

async function fetchAnonymousAttemptStats(): Promise<AnonymousQuizLinkBackfillStats[]> {
  const rows = await prisma.$queryRaw<RawAnonymousQuizAttemptStatsRow[]>`
    SELECT
      qa.quiz_link_id AS quizLinkId,
      COUNT(*) AS startedCount,
      SUM(CASE WHEN qa.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completedCount,
      COALESCE(SUM(CASE WHEN qa.status = 'COMPLETED' AND qa.score IS NOT NULL THEN qa.score ELSE 0 END), 0) AS scoreSum,
      SUM(CASE WHEN qa.status = 'COMPLETED' AND qa.score IS NOT NULL THEN 1 ELSE 0 END) AS scoreCount,
      MAX(CASE WHEN qa.status = 'COMPLETED' AND qa.score IS NOT NULL THEN qa.score ELSE NULL END) AS bestScore,
      MIN(CASE WHEN qa.status = 'COMPLETED' AND qa.score IS NOT NULL THEN qa.score ELSE NULL END) AS lowestScore,
      MAX(qa.started_at) AS lastStartedAt,
      MAX(CASE WHEN qa.status = 'COMPLETED' THEN qa.finished_at ELSE NULL END) AS lastCompletedAt
    FROM quiz_attempts qa
    WHERE qa.participant_id IS NULL
    GROUP BY qa.quiz_link_id
    ORDER BY startedCount DESC
  `;

  return rows.map(mapRawRowToBackfillStats);
}

async function countTotalAnonymousAttempts(): Promise<number> {
  return prisma.quizAttempt.count({
    where: {
      participantId: null,
    },
  });
}

async function fetchExistingQuizLinkAnonymousStatsIds(): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<ExistingAnonymousStatsRow[]>`
    SELECT quiz_link_id AS quizLinkId
    FROM quiz_link_anonymous_stats
  `;
  return new Set(rows.map((row) => row.quizLinkId));
}

type QuizLinkTopTenContext = {
  quizId: string;
  quizName: string;
  ownerId: string | null;
  ownerEmail: string | null;
};

async function fetchQuizLinkContextForTopTen(
  quizLinkIds: string[],
): Promise<Map<string, QuizLinkTopTenContext>> {
  if (quizLinkIds.length === 0) {
    return new Map();
  }

  const links = await prisma.quizLink.findMany({
    where: {
      id: {
        in: quizLinkIds,
      },
    },
    select: {
      id: true,
      quiz: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          owner: {
            select: {
              email: true,
            },
          },
        },
      },
    },
  });

  const byQuizLinkId = new Map<string, QuizLinkTopTenContext>();

  for (const link of links) {
    const quiz = link.quiz;
    byQuizLinkId.set(link.id, {
      quizId: quiz?.id ?? "(inconnu)",
      quizName: quiz?.name ?? "(inconnu)",
      ownerId: quiz?.ownerId ?? null,
      ownerEmail: quiz?.owner?.email ?? null,
    });
  }

  return byQuizLinkId;
}

function formatOwnerForDisplay(context: QuizLinkTopTenContext | undefined): string {
  if (!context) {
    return "-";
  }

  if (context.ownerEmail) {
    return context.ownerEmail;
  }

  if (context.ownerId) {
    return context.ownerId;
  }

  return "-";
}

async function printTopQuizLinks(statsByQuizLink: AnonymousQuizLinkBackfillStats[]): Promise<void> {
  const topTen = statsByQuizLink
    .slice()
    .sort((left, right) => right.startedCount - left.startedCount)
    .slice(0, 10);

  if (topTen.length === 0) {
    console.log("Top 10 quizLink anonymes: aucun");
    return;
  }

  const contextByQuizLinkId = await fetchQuizLinkContextForTopTen(topTen.map((stats) => stats.quizLinkId));

  console.log("Top 10 quizLink anonymes (par startedCount):");
  topTen.forEach((stats, index) => {
    const ctx = contextByQuizLinkId.get(stats.quizLinkId);
    const ownerDisplay = formatOwnerForDisplay(ctx);
    const quizId = ctx?.quizId ?? "(inconnu)";
    const quizName = ctx?.quizName ?? "(inconnu)";

    console.log(
      `${index + 1}. quizLink=${stats.quizLinkId} | quizId=${quizId} | quiz="${quizName}" | owner=${ownerDisplay} | started=${stats.startedCount} | completed=${stats.completedCount} | scoreCount=${stats.scoreCount} | lastStarted=${formatDate(stats.lastStartedAt)}`,
    );
  });
}

async function createStats(statsByQuizLink: AnonymousQuizLinkBackfillStats[]): Promise<void> {
  for (const stats of statsByQuizLink) {
    await prisma.quizLinkAnonymousStats.create({
      data: stats,
    });
  }
}

async function overwriteStats(statsByQuizLink: AnonymousQuizLinkBackfillStats[]): Promise<void> {
  for (const stats of statsByQuizLink) {
    await prisma.quizLinkAnonymousStats.upsert({
      where: {
        quizLinkId: stats.quizLinkId,
      },
      create: stats,
      update: stats,
    });
  }
}

export function buildBackfillPlan(
  statsByQuizLink: AnonymousQuizLinkBackfillStats[],
  existingQuizLinkIds: Set<string>,
  overwrite: boolean,
): BackfillPlan {
  const toCreate: AnonymousQuizLinkBackfillStats[] = [];
  const toOverwrite: AnonymousQuizLinkBackfillStats[] = [];
  const skippedExisting: AnonymousQuizLinkBackfillStats[] = [];

  for (const stats of statsByQuizLink) {
    if (existingQuizLinkIds.has(stats.quizLinkId)) {
      if (overwrite) {
        toOverwrite.push(stats);
      } else {
        skippedExisting.push(stats);
      }
    } else {
      toCreate.push(stats);
    }
  }

  return { toCreate, toOverwrite, skippedExisting };
}

async function runBackfill(): Promise<void> {
  const { dryRun, confirm, overwrite } = parseOptions(process.argv.slice(2));

  if (!dryRun && !confirm) {
    console.error("Refus d'ecriture: ajoutez --confirm pour executer les upserts, ou --dry-run pour simuler.");
    process.exit(1);
  }

  const [totalAnonymousAttempts, statsByQuizLink, existingQuizLinkIds] = await Promise.all([
    countTotalAnonymousAttempts(),
    fetchAnonymousAttemptStats(),
    fetchExistingQuizLinkAnonymousStatsIds(),
  ]);
  const plan = buildBackfillPlan(statsByQuizLink, existingQuizLinkIds, overwrite);

  const totalCompleted = statsByQuizLink.reduce((sum, stats) => sum + stats.completedCount, 0);
  const totalScoreCount = statsByQuizLink.reduce((sum, stats) => sum + stats.scoreCount, 0);

  console.log("=== Backfill quiz_link_anonymous_stats ===");
  console.log(`Mode: ${dryRun ? "DRY RUN (aucune ecriture)" : "CONFIRM (ecriture active)"}`);
  console.log(`Overwrite: ${overwrite ? "ON (les lignes existantes seront ecrasees)" : "OFF (les lignes existantes seront ignorees)"}`);
  console.log(
    `Lignes QuizAttempt anonymes (source backfill): ${totalAnonymousAttempts}`,
  );
  console.log(`QuizLink concernes: ${statsByQuizLink.length}`);
  console.log(`Total completed: ${totalCompleted}`);
  console.log(`Total scoreCount: ${totalScoreCount}`);
  console.log(`Lignes a creer: ${plan.toCreate.length}`);
  console.log(`Lignes existantes ignorees: ${plan.skippedExisting.length}`);
  console.log(`Lignes a ecraser: ${plan.toOverwrite.length}`);
  await printTopQuizLinks(statsByQuizLink);

  if (dryRun) {
    return;
  }

  if (plan.toCreate.length > 0) {
    await createStats(plan.toCreate);
  }
  if (plan.toOverwrite.length > 0) {
    await overwriteStats(plan.toOverwrite);
  }

  console.log(`Lignes creees: ${plan.toCreate.length}`);
  console.log(`Lignes existantes ignorees: ${plan.skippedExisting.length}`);
  if (overwrite) {
    console.log(`Lignes ecrasees: ${plan.toOverwrite.length}`);
  }
}

const isDirectExecution =
  typeof process.argv[1] === "string" &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
  runBackfill()
    .catch((error) => {
      console.error("Erreur pendant le backfill des stats anonymes:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
