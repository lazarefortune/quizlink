/**
 * Script de maintenance (post-migration) : audit ou suppression des anciennes lignes
 * QuizAttempt / QuizAnswer avec participantId = null, après portage des agrégats vers
 * quiz_link_anonymous_stats. Le jeu anonyme courant n’utilise plus ces tables.
 *
 * Usage :
 *   npx tsx scripts/cleanup-anonymous-attempts.ts --dry-run
 *   npx tsx scripts/cleanup-anonymous-attempts.ts --confirm
 *   npx tsx scripts/cleanup-anonymous-attempts.ts --confirm-delete
 */

import { pathToFileURL } from "node:url";

import { prisma } from "../lib/prisma";

const ANONYMOUS_ATTEMPT_FILTER = { participantId: null } as const;

export type CleanupAnonymousAttemptsMode = "dry-run" | "confirm" | "confirm-delete";

export type ParseCleanupArgsResult =
  | { ok: true; mode: CleanupAnonymousAttemptsMode }
  | { ok: false; message: string };

export function parseCleanupAnonymousAttemptsArgs(
  argv: string[],
): ParseCleanupArgsResult {
  const hasDryRun = argv.includes("--dry-run");
  const hasConfirm = argv.includes("--confirm");
  const hasConfirmDelete = argv.includes("--confirm-delete");

  if (!hasDryRun && !hasConfirm && !hasConfirmDelete) {
    return {
      ok: false,
      message:
        "Indiquez --dry-run (audit), --confirm (audit + rappel), ou --confirm-delete (suppression après contrôles).",
    };
  }

  if (hasConfirm && hasConfirmDelete && !hasDryRun) {
    return {
      ok: false,
      message:
        "Ne combinez pas --confirm et --confirm-delete. Utilisez --dry-run pour auditer, ou uniquement --confirm-delete pour supprimer.",
    };
  }

  if (hasDryRun) {
    return { ok: true, mode: "dry-run" };
  }

  if (hasConfirmDelete) {
    return { ok: true, mode: "confirm-delete" };
  }

  return { ok: true, mode: "confirm" };
}

export type QuizLinkAnonymousAggregate = {
  anonymousAttempts: number;
  completedAttempts: number;
};

export type AnonymousStatsSnapshot = {
  startedCount: number;
  completedCount: number;
};

export type BackfillValidationFailure = {
  quizLinkId: string;
  reason: string;
};

/** Ligne agrégée (ex. issue d’un groupBy Prisma quizLinkId + status). */
export type QuizLinkStatusCountRow = {
  quizLinkId: string;
  status: string;
  count: number;
};

export function aggregatesFromQuizLinkStatusCounts(
  rows: QuizLinkStatusCountRow[],
): Map<string, QuizLinkAnonymousAggregate> {
  const map = new Map<string, QuizLinkAnonymousAggregate>();

  for (const row of rows) {
    const current = map.get(row.quizLinkId) ?? {
      anonymousAttempts: 0,
      completedAttempts: 0,
    };

    current.anonymousAttempts += row.count;
    if (row.status === "COMPLETED") {
      current.completedAttempts += row.count;
    }

    map.set(row.quizLinkId, current);
  }

  return map;
}

export function validateAnonymousStatsBeforeCleanup(
  aggregates: Map<string, QuizLinkAnonymousAggregate>,
  statsByQuizLinkId: Map<string, AnonymousStatsSnapshot | null | undefined>,
): { ok: true } | { ok: false; failures: BackfillValidationFailure[] } {
  const failures: BackfillValidationFailure[] = [];

  for (const [quizLinkId, agg] of aggregates) {
    const stats = statsByQuizLinkId.get(quizLinkId);

    if (stats == null) {
      failures.push({
        quizLinkId,
        reason:
          "ligne quiz_link_anonymous_stats absente (backfill requis avant suppression)",
      });
      continue;
    }

    if (stats.startedCount < agg.anonymousAttempts) {
      failures.push({
        quizLinkId,
        reason: `startedCount (${stats.startedCount}) < QuizAttempt anonymes (${agg.anonymousAttempts})`,
      });
      continue;
    }

    if (stats.completedCount < agg.completedAttempts) {
      failures.push({
        quizLinkId,
        reason: `completedCount (${stats.completedCount}) < tentatives COMPLETED (${agg.completedAttempts})`,
      });
      continue;
    }
  }

  if (failures.length > 0) {
    return { ok: false, failures };
  }

  return { ok: true };
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

async function fetchAnonymousAggregatesByQuizLink(): Promise<
  Map<string, QuizLinkAnonymousAggregate>
> {
  const rows = await prisma.quizAttempt.groupBy({
    by: ["quizLinkId", "status"],
    where: ANONYMOUS_ATTEMPT_FILTER,
    _count: { _all: true },
  });

  const normalized: QuizLinkStatusCountRow[] = rows.map((row) => ({
    quizLinkId: row.quizLinkId,
    status: row.status,
    count: row._count._all,
  }));

  return aggregatesFromQuizLinkStatusCounts(normalized);
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
  console.log("=== Audit — QuizAttempt anonymes restantes (participantId = null) ===");
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
  console.log("Top 10 quizLink par nombre de QuizAttempt anonymes :");
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
    console.log("  (aucune QuizAttempt anonyme)");
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

type ConfirmDeleteOutcome = "noop" | "validation-failed" | "deleted";

async function runConfirmDelete(): Promise<ConfirmDeleteOutcome> {
  const totalAttempts = await prisma.quizAttempt.count({
    where: ANONYMOUS_ATTEMPT_FILTER,
  });

  if (totalAttempts === 0) {
    console.log("Aucune QuizAttempt anonyme : rien à supprimer.");
    return "noop";
  }

  const aggregates = await fetchAnonymousAggregatesByQuizLink();
  const quizLinkIds = [...aggregates.keys()];

  const statsRows = await prisma.quizLinkAnonymousStats.findMany({
    where: { quizLinkId: { in: quizLinkIds } },
    select: {
      quizLinkId: true,
      startedCount: true,
      completedCount: true,
    },
  });

  const statsByQuizLinkId = new Map<
    string,
    AnonymousStatsSnapshot | null | undefined
  >();
  for (const id of quizLinkIds) {
    statsByQuizLinkId.set(id, undefined);
  }
  for (const row of statsRows) {
    statsByQuizLinkId.set(row.quizLinkId, {
      startedCount: row.startedCount,
      completedCount: row.completedCount,
    });
  }

  const validation = validateAnonymousStatsBeforeCleanup(
    aggregates,
    statsByQuizLinkId,
  );

  if (!validation.ok) {
    console.error("");
    console.error(
      "Refus de suppression : incohérence ou stats anonymes manquantes pour au moins un quizLink.",
    );
    console.error("");
    for (const f of validation.failures) {
      console.error(`  - ${f.quizLinkId}: ${f.reason}`);
    }
    console.error("");
    process.exitCode = 1;
    return "validation-failed";
  }

  const linkedAnswersBefore = await prisma.quizAnswer.count({
    where: { attempt: ANONYMOUS_ATTEMPT_FILTER },
  });

  const deleteResult = await prisma.quizAttempt.deleteMany({
    where: ANONYMOUS_ATTEMPT_FILTER,
  });

  console.log("");
  console.log("=== Suppression — QuizAttempt anonymes uniquement ===");
  console.log("");
  console.log(
    `QuizAnswer liées (comptées avant suppression, cascade attendue) : ${linkedAnswersBefore}`,
  );
  console.log(`QuizAttempt supprimées : ${deleteResult.count}`);
  console.log("");
  console.log(
    "Les QuizAnswer ont été retirées par cascade si le schéma Prisma le prévoit (onDelete: Cascade).",
  );
  console.log("");

  return "deleted";
}

async function main(): Promise<void> {
  const parsed = parseCleanupAnonymousAttemptsArgs(process.argv.slice(2));

  if (!parsed.ok) {
    console.error(parsed.message);
    process.exitCode = 1;
    return;
  }

  try {
    if (parsed.mode === "confirm-delete") {
      const outcome = await runConfirmDelete();
      if (outcome === "validation-failed") {
        return;
      }
      if (outcome === "noop") {
        console.log(
          "Mode --confirm-delete : aucune suppression nécessaire (déjà vide).",
        );
        return;
      }
      console.log(
        "Mode --confirm-delete : suppression terminée (uniquement participantId = null).",
      );
      return;
    }

    await runAudit();

    if (parsed.mode === "confirm") {
      console.log(
        "Mode --confirm : audit uniquement, aucune suppression. Pour supprimer réellement, utilisez --confirm-delete.",
      );
    } else {
      console.log("Mode --dry-run : aucune écriture en base.");
    }
  } catch (error) {
    console.error("Erreur :", error);
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
