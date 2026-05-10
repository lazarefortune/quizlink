/**
 * Audit (and future cleanup) of legacy anonymous QuizAttempt / QuizAnswer rows
 * (participantId = null). No deletion in this version unless extended later.
 *
 * Usage:
 *   pnpm tsx scripts/cleanup-anonymous-attempts.ts --dry-run
 *   pnpm tsx scripts/cleanup-anonymous-attempts.ts --confirm   # audit only for now
 */

import { pathToFileURL } from "node:url";

import { prisma } from "../lib/prisma";

const ANONYMOUS_ATTEMPT_FILTER = { participantId: null } as const;

export type CleanupAnonymousAttemptsMode = "dry-run" | "confirm";

export type ParseCleanupArgsResult =
  | { ok: true; mode: CleanupAnonymousAttemptsMode }
  | { ok: false; message: string };

export function parseCleanupAnonymousAttemptsArgs(
  argv: string[],
): ParseCleanupArgsResult {
  const hasDryRun = argv.includes("--dry-run");
  const hasConfirm = argv.includes("--confirm");

  if (!hasDryRun && !hasConfirm) {
    return {
      ok: false,
      message:
        "Indiquez --dry-run (audit sans suppression) ou --confirm (audit ; suppression réelle non activée pour l’instant).",
    };
  }

  if (hasDryRun && hasConfirm) {
    return { ok: true, mode: "dry-run" };
  }

  if (hasDryRun) {
    return { ok: true, mode: "dry-run" };
  }

  return { ok: true, mode: "confirm" };
}

export type AnonymousAttemptLite = {
  quizLinkId: string;
  status: string;
  answerCount: number;
};

export type PerQuizLinkAnonymousRollup = {
  anonymousAttempts: number;
  linkedAnswers: number;
  completedAttempts: number;
  inProgressAttempts: number;
  abandonedAttempts: number;
  otherStatusAttempts: number;
};

export function rollupAnonymousAttemptsPerQuizLink(
  rows: AnonymousAttemptLite[],
): Map<string, PerQuizLinkAnonymousRollup> {
  const map = new Map<string, PerQuizLinkAnonymousRollup>();

  for (const row of rows) {
    const current = map.get(row.quizLinkId) ?? {
      anonymousAttempts: 0,
      linkedAnswers: 0,
      completedAttempts: 0,
      inProgressAttempts: 0,
      abandonedAttempts: 0,
      otherStatusAttempts: 0,
    };

    current.anonymousAttempts += 1;
    current.linkedAnswers += row.answerCount;

    if (row.status === "COMPLETED") {
      current.completedAttempts += 1;
    } else if (row.status === "IN_PROGRESS") {
      current.inProgressAttempts += 1;
    } else if (row.status === "ABANDONED") {
      current.abandonedAttempts += 1;
    } else {
      current.otherStatusAttempts += 1;
    }

    map.set(row.quizLinkId, current);
  }

  return map;
}

export function formatStatusBreakdownLine(
  label: string,
  count: number,
  total: number,
): string {
  if (total <= 0) {
    return `  ${label}: 0`;
  }
  const pct = ((count / total) * 100).toFixed(1);
  return `  ${label}: ${count} (${pct}%)`;
}

function resolveQuizOwnerEmail(quiz: {
  owner: { email: string } | null;
  createdByAdmin: { email: string } | null;
}): string {
  if (quiz.owner?.email) {
    return quiz.owner.email;
  }
  if (quiz.createdByAdmin?.email) {
    return quiz.createdByAdmin.email;
  }
  return "—";
}

async function runAudit(): Promise<void> {
  const [totalAttempts, totalAnswers, byStatus, distinctLinksCount, topLinks] =
    await Promise.all([
      prisma.quizAttempt.count({ where: ANONYMOUS_ATTEMPT_FILTER }),
      prisma.quizAnswer.count({
        where: { attempt: ANONYMOUS_ATTEMPT_FILTER },
      }),
      prisma.quizAttempt.groupBy({
        by: ["status"],
        where: ANONYMOUS_ATTEMPT_FILTER,
        _count: { _all: true },
      }),
      prisma.quizAttempt
        .findMany({
          where: ANONYMOUS_ATTEMPT_FILTER,
          select: { quizLinkId: true },
          distinct: ["quizLinkId"],
        })
        .then((rows) => rows.length),
      prisma.quizAttempt.groupBy({
        by: ["quizLinkId"],
        where: ANONYMOUS_ATTEMPT_FILTER,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
    ]);

  const statusCounts: Record<string, number> = {
    IN_PROGRESS: 0,
    COMPLETED: 0,
    ABANDONED: 0,
  };
  let otherStatusTotal = 0;

  for (const row of byStatus) {
    const count = row._count._all;
    if (row.status in statusCounts) {
      statusCounts[row.status] = count;
    } else {
      otherStatusTotal += count;
    }
  }

  const topLinkIds = topLinks.map((row) => row.quizLinkId);

  const [linkRecords, attemptDetails] = await Promise.all([
    topLinkIds.length > 0
      ? prisma.quizLink.findMany({
          where: { id: { in: topLinkIds } },
          include: {
            quiz: {
              include: {
                owner: { select: { email: true } },
                createdByAdmin: { select: { email: true } },
              },
            },
            anonymousStats: true,
          },
        })
      : Promise.resolve([]),
    topLinkIds.length > 0
      ? prisma.quizAttempt.findMany({
          where: {
            participantId: null,
            quizLinkId: { in: topLinkIds },
          },
          select: {
            quizLinkId: true,
            status: true,
            _count: { select: { answers: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const attemptLite: AnonymousAttemptLite[] = attemptDetails.map((a) => ({
    quizLinkId: a.quizLinkId,
    status: a.status,
    answerCount: a._count.answers,
  }));

  const rollup = rollupAnonymousAttemptsPerQuizLink(attemptLite);
  const linkById = new Map(linkRecords.map((link) => [link.id, link]));

  console.log("");
  console.log("=== Audit — tentatives anonymes (participantId = null) ===");
  console.log("");
  console.log(`Total QuizAttempt anonymes : ${totalAttempts}`);
  console.log(`Total QuizAnswer liées     : ${totalAnswers}`);
  console.log("");
  console.log("Répartition par status :");
  console.log(
    formatStatusBreakdownLine("IN_PROGRESS", statusCounts.IN_PROGRESS, totalAttempts),
  );
  console.log(
    formatStatusBreakdownLine("COMPLETED", statusCounts.COMPLETED, totalAttempts),
  );
  console.log(
    formatStatusBreakdownLine("ABANDONED", statusCounts.ABANDONED, totalAttempts),
  );
  if (otherStatusTotal > 0) {
    console.log(
      formatStatusBreakdownLine("(autres status)", otherStatusTotal, totalAttempts),
    );
  }
  console.log("");
  console.log(`Nombre de quizLink concernés : ${distinctLinksCount}`);
  console.log("");
  console.log(
    "Estimation volume supprimable (suppression QuizAttempt en cascade sur QuizAnswer) :",
  );
  console.log(`  - ${totalAttempts} lignes quiz_attempts`);
  console.log(`  - ${totalAnswers} lignes quiz_answers`);
  console.log("");
  console.log("Top 10 quizLink par nombre de tentatives anonymes :");
  console.log("");

  const col = (value: string, width: number): string =>
    value.length >= width ? value.slice(0, width - 1) + "…" : value.padEnd(width);

  const header =
    col("quizLinkId", 26) +
    col("quizId", 26) +
    col("quiz", 22) +
    col("owner", 28) +
    col("att", 6) +
    col("ans", 6) +
    col("done", 6) +
    col("startedSt", 10) +
    col("completedSt", 11);
  console.log(header);
  console.log("-".repeat(header.length));

  for (const row of topLinks) {
    const link = linkById.get(row.quizLinkId);
    const r = rollup.get(row.quizLinkId);
    const attemptsCount = row._count.id;
    const answersCount = r?.linkedAnswers ?? 0;
    const completedFromAttempts = r?.completedAttempts ?? 0;
    const startedStats = link?.anonymousStats?.startedCount;
    const completedStats = link?.anonymousStats?.completedCount;

    const startedDisplay =
      startedStats !== undefined ? String(startedStats) : String(attemptsCount);
    const completedStatsDisplay =
      completedStats !== undefined ? String(completedStats) : "—";

    const quizName = link?.quiz.name ?? "—";
    const ownerEmail = link ? resolveQuizOwnerEmail(link.quiz) : "—";
    const quizId = link?.quizId ?? "—";

    console.log(
      col(row.quizLinkId, 26) +
        col(quizId, 26) +
        col(quizName, 22) +
        col(ownerEmail, 28) +
        col(String(attemptsCount), 6) +
        col(String(answersCount), 6) +
        col(String(completedFromAttempts), 6) +
        col(startedDisplay, 10) +
        col(completedStatsDisplay, 11),
    );
  }

  if (topLinks.length === 0) {
    console.log("  (aucune tentative anonyme)");
  }

  console.log("");
  console.log(
    "Colonnes : att = attempts anonymes, ans = réponses liées, done = COMPLETED (lignes),",
  );
  console.log(
    "startedSt = started_count (quiz_link_anonymous_stats, sinon nombre d’attempts),",
  );
  console.log(
    "completedSt = completed_count (quiz_link_anonymous_stats, sinon —).",
  );
  console.log("");
}

async function main(): Promise<void> {
  const parsed = parseCleanupAnonymousAttemptsArgs(process.argv.slice(2));

  if (!parsed.ok) {
    console.error(parsed.message);
    process.exitCode = 1;
    return;
  }

  try {
    await runAudit();

    if (parsed.mode === "confirm") {
      console.log(
        "Mode --confirm : aucune suppression exécutée (activation ultérieure).",
      );
    } else {
      console.log("Mode --dry-run : aucune écriture en base.");
    }
  } catch (error) {
    console.error("Erreur lors de l’audit :", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectExecution =
  typeof process.argv[1] === "string" &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
  void main();
}
