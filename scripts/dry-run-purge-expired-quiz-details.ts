/**
 * Audit / purge des `QuizAnswer` et données personnelles associées aux quiz links
 * expirés (délai de grâce).
 *
 * Usage :
 *   npx tsx scripts/dry-run-purge-expired-quiz-details.ts --dry-run [--quizId=xxx] [--verbose]
 *   npx tsx scripts/dry-run-purge-expired-quiz-details.ts --apply --quizId=xxx [--verbose]
 *   npx tsx scripts/dry-run-purge-expired-quiz-details.ts --apply --allowGlobalApply [--verbose]
 *
 * Apply supprime uniquement :
 * - QuizAnswer des parties éligibles
 * - participantName / participantEmail
 * - marque QuizLink.detailsPurgedAt
 *
 * Apply ne supprime jamais QuizAttempt ni les agrégats.
 */

import { pathToFileURL } from "node:url";

import { prisma } from "../lib/prisma";
import {
  computeExpiredQuizDetailsPurgeEligibility,
  type ExpiredQuizDetailsPurgePlanEntry,
  type ExpiredQuizDetailsPurgePlanSummary,
  type QuizDetailsPurgeCounts,
} from "../lib/quiz/computeExpiredQuizDetailsPurgePlan";
import { getActiveUserSubscriptionAccess } from "../lib/quiz/getActiveUserSubscriptionAccess";
import {
  findEligibleAttemptIdsForQuizLink,
  purgeQuizLinkDetailedResponses,
} from "../lib/quiz/purgeExpiredQuizDetails";
import { QUIZ_DETAILS_PURGE_GRACE_DAYS } from "../lib/quiz/quizUnlockConstants";

const DEFAULT_BATCH_SIZE = 100;

export type PurgeExpiredQuizDetailsMode = "dry-run" | "apply";

export type PurgeExpiredQuizDetailsOptions = {
  mode: PurgeExpiredQuizDetailsMode;
  quizId?: string;
  batchSize: number;
  verbose: boolean;
  allowGlobalApply: boolean;
};

/** @deprecated Use PurgeExpiredQuizDetailsOptions */
export type DryRunPurgeExpiredQuizDetailsOptions = PurgeExpiredQuizDetailsOptions & {
  dryRun: true;
};

export type PurgeApplySummary = {
  linksPurged: number;
  attemptsAnonymized: number;
  answersDeleted: number;
  participantNamesCleared: number;
  participantEmailsCleared: number;
};

export function printPurgeExpiredQuizDetailsUsage(): void {
  console.log(`Usage:
  npx tsx scripts/dry-run-purge-expired-quiz-details.ts --dry-run [--quizId=xxx] [--batchSize=100] [--verbose]
  npx tsx scripts/dry-run-purge-expired-quiz-details.ts --apply --quizId=xxx [--batchSize=100] [--verbose]
  npx tsx scripts/dry-run-purge-expired-quiz-details.ts --apply --allowGlobalApply [--batchSize=100] [--verbose]

Options:
  --dry-run            Simule sans écrire en base (mutuellement exclusif avec --apply)
  --apply              Purge réelle des réponses détaillées éligibles
  --quizId=xxx         Limite le scan / apply à un quiz
  --allowGlobalApply   Autorise --apply sans --quizId (purge globale)
  --batchSize=N        Taille de batch (défaut: ${DEFAULT_BATCH_SIZE})
  --verbose            Affiche les détails par lien
`);
}

/** @deprecated Use printPurgeExpiredQuizDetailsUsage */
export const printDryRunPurgeExpiredQuizDetailsUsage = printPurgeExpiredQuizDetailsUsage;

export function parsePurgeExpiredQuizDetailsOptions(
  argv: string[],
): PurgeExpiredQuizDetailsOptions {
  const hasDryRun = argv.includes("--dry-run");
  const hasApply = argv.includes("--apply");
  const allowGlobalApply = argv.includes("--allowGlobalApply");

  if (allowGlobalApply && !hasApply) {
    throw new Error("--allowGlobalApply ne fonctionne qu'avec --apply");
  }

  if (hasDryRun && hasApply) {
    throw new Error("--dry-run et --apply sont mutuellement exclusifs");
  }

  if (!hasDryRun && !hasApply) {
    throw new Error("Fournissez --dry-run ou --apply");
  }

  const quizIdArg = argv.find((arg) => arg.startsWith("--quizId="));
  const quizId = quizIdArg ? quizIdArg.slice("--quizId=".length).trim() : undefined;

  if (hasApply && !quizId && !allowGlobalApply) {
    throw new Error(
      "--apply sans --quizId est refusé. Ajoutez --quizId=xxx ou --allowGlobalApply",
    );
  }

  const batchSizeArg = argv.find((arg) => arg.startsWith("--batchSize="));
  const parsedBatchSize = batchSizeArg
    ? Number.parseInt(batchSizeArg.slice("--batchSize=".length), 10)
    : DEFAULT_BATCH_SIZE;

  const batchSize =
    Number.isFinite(parsedBatchSize) && parsedBatchSize > 0
      ? parsedBatchSize
      : DEFAULT_BATCH_SIZE;

  const verbose = argv.includes("--verbose");

  return {
    mode: hasApply ? "apply" : "dry-run",
    quizId,
    batchSize,
    verbose,
    allowGlobalApply,
  };
}

/** @deprecated Use parsePurgeExpiredQuizDetailsOptions */
export function parseDryRunPurgeExpiredQuizDetailsOptions(
  argv: string[],
): DryRunPurgeExpiredQuizDetailsOptions {
  const parsed = parsePurgeExpiredQuizDetailsOptions(argv);
  if (parsed.mode !== "dry-run") {
    throw new Error("Flag obligatoire: --dry-run");
  }
  return { ...parsed, dryRun: true };
}

async function countQuizLinkDetailsCounts(
  quizLinkId: string,
): Promise<QuizDetailsPurgeCounts> {
  const [
    attemptsEligible,
    answersEligible,
    participantNamesEligible,
    participantEmailsEligible,
  ] = await Promise.all([
    prisma.quizAttempt.count({
      where: {
        quizLinkId,
        OR: [
          { participantName: { not: null } },
          { participantEmail: { not: null } },
          { answers: { some: {} } },
        ],
      },
    }),
    prisma.quizAnswer.count({
      where: {
        attempt: { quizLinkId },
      },
    }),
    prisma.quizAttempt.count({
      where: { quizLinkId, participantName: { not: null } },
    }),
    prisma.quizAttempt.count({
      where: { quizLinkId, participantEmail: { not: null } },
    }),
  ]);

  const attemptsAlreadyPurgedOrNoAnswers = await prisma.quizAttempt.count({
    where: {
      quizLinkId,
      participantName: null,
      participantEmail: null,
      answers: { none: {} },
    },
  });

  return {
    attemptsEligible,
    answersEligible,
    participantNamesEligible,
    participantEmailsEligible,
    attemptsAlreadyPurgedOrNoAnswers,
  };
}

async function quizUnlockActiveForOwner(params: {
  quizId: string;
  ownerId: string;
  now: Date;
  cached: Map<string, boolean>;
}): Promise<boolean> {
  const key = `${params.quizId}:${params.ownerId}`;
  const cached = params.cached.get(key);
  if (cached != null) return cached;

  const row = await prisma.quizUnlock.findFirst({
    where: {
      quizId: params.quizId,
      userId: params.ownerId,
      expiresAt: { gt: params.now },
    },
    select: { id: true },
  });

  const isActive = row != null;
  params.cached.set(key, isActive);
  return isActive;
}

export async function buildExpiredQuizDetailsPurgePlan(
  options: Pick<PurgeExpiredQuizDetailsOptions, "quizId" | "batchSize">,
  now = new Date(),
): Promise<ExpiredQuizDetailsPurgePlanSummary> {
  const graceDays = QUIZ_DETAILS_PURGE_GRACE_DAYS;
  const proCache = new Map<string, boolean>();
  const unlockCache = new Map<string, boolean>();

  const quizIdsSeen = new Set<string>();
  const eligibleEntries: ExpiredQuizDetailsPurgePlanEntry[] = [];

  let linksScanned = 0;
  let linksEligible = 0;
  let linksSkippedPro = 0;
  let linksSkippedUnlock = 0;
  let linksSkippedNotExpired = 0;
  let attemptsEligible = 0;
  let answersEligible = 0;
  let participantNamesEligible = 0;
  let participantEmailsEligible = 0;
  let attemptsAlreadyPurgedOrNoAnswers = 0;

  let cursorId: string | undefined;

  while (true) {
    const links = await prisma.quizLink.findMany({
      where: {
        detailsPurgedAt: null,
        acceptingResponsesUntil: { not: null },
        ...(options.quizId ? { quizId: options.quizId } : {}),
      },
      select: {
        id: true,
        quizId: true,
        acceptingResponsesUntil: true,
        detailsPurgedAt: true,
        unlockedUntil: true,
        quiz: {
          select: {
            name: true,
            ownerId: true,
          },
        },
      },
      orderBy: { id: "asc" },
      take: options.batchSize,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    });

    if (links.length === 0) break;

    for (const link of links) {
      const quizTitle = link.quiz?.name ?? null;
      const ownerId = link.quiz?.ownerId ?? null;
      const quizId = link.quizId;
      quizIdsSeen.add(quizId);

      linksScanned += 1;

      if (ownerId == null) {
        linksSkippedNotExpired += 1;
        continue;
      }

      const acceptingResponsesUntil = link.acceptingResponsesUntil;
      if (acceptingResponsesUntil == null) {
        linksSkippedNotExpired += 1;
        continue;
      }

      const purgeEligibleAt = new Date(
        acceptingResponsesUntil.getTime() + graceDays * 24 * 60 * 60 * 1000,
      );

      if (purgeEligibleAt >= now) {
        linksSkippedNotExpired += 1;
        continue;
      }

      if (link.unlockedUntil != null && link.unlockedUntil > now) {
        linksSkippedUnlock += 1;
        continue;
      }

      let ownerProActive = proCache.get(ownerId);
      if (ownerProActive == null) {
        const access = await getActiveUserSubscriptionAccess(ownerId);
        ownerProActive = access.isActive;
        proCache.set(ownerId, ownerProActive);
      }

      if (ownerProActive) {
        linksSkippedPro += 1;
        continue;
      }

      const quizUnlockActive = await quizUnlockActiveForOwner({
        quizId,
        ownerId,
        now,
        cached: unlockCache,
      });

      if (quizUnlockActive) {
        linksSkippedUnlock += 1;
        continue;
      }

      const counts = await countQuizLinkDetailsCounts(link.id);

      const eligibility = computeExpiredQuizDetailsPurgeEligibility({
        quizId,
        quizTitle,
        ownerId,
        quizLinkId: link.id,
        acceptingResponsesUntil,
        detailsPurgedAt: link.detailsPurgedAt,
        unlockedUntil: link.unlockedUntil,
        now,
        graceDays,
        ownerProActive,
        quizUnlockActive,
        counts,
      });

      attemptsAlreadyPurgedOrNoAnswers += counts.attemptsAlreadyPurgedOrNoAnswers;

      if (!eligibility.eligible) {
        continue;
      }

      linksEligible += 1;
      attemptsEligible += counts.attemptsEligible;
      answersEligible += counts.answersEligible;
      participantNamesEligible += counts.participantNamesEligible;
      participantEmailsEligible += counts.participantEmailsEligible;

      eligibleEntries.push({
        quizId,
        quizTitle,
        ownerId,
        quizLinkId: link.id,
        acceptingResponsesUntil,
        purgeEligibleAt: eligibility.purgeEligibleAt,
        counts,
      });
    }

    cursorId = links[links.length - 1]?.id;
    if (links.length < options.batchSize) break;
  }

  const quizzesEligible = new Set(eligibleEntries.map((entry) => entry.quizId)).size;

  return {
    quizzesScanned: quizIdsSeen.size,
    quizzesEligible,
    linksScanned,
    linksEligible,
    linksSkippedPro,
    linksSkippedUnlock,
    linksSkippedNotExpired,
    attemptsEligible,
    answersEligible,
    participantNamesEligible,
    participantEmailsEligible,
    attemptsAlreadyPurgedOrNoAnswers,
    eligibleEntries,
  };
}

function printPlanSummary(
  plan: ExpiredQuizDetailsPurgePlanSummary,
  options: PurgeExpiredQuizDetailsOptions,
  now: Date,
): void {
  const modeLabel =
    options.mode === "dry-run"
      ? "DRY RUN (aucune ecriture)"
      : "APPLY (ecriture active)";

  console.log(`Purge quiz details (expired links)`);
  console.log(`Mode : ${modeLabel}`);
  console.log(`Date : ${now.toISOString()}`);
  console.log(`Grace period : ${QUIZ_DETAILS_PURGE_GRACE_DAYS} jours`);
  console.log(`BatchSize : ${options.batchSize}`);
  if (options.mode === "apply") {
    console.log(
      `WARNING: cette operation va supprimer les reponses detaillees et anonymiser les infos participant des liens eligibles.`,
    );
  }

  console.log(`\nScannés :`);
  console.log(`- Quiz : ${plan.quizzesScanned}`);
  console.log(`- Liens : ${plan.linksScanned}`);
  console.log(`\nÉligibles :`);
  console.log(`- Quiz : ${plan.quizzesEligible}`);
  console.log(`- Parties : ${plan.attemptsEligible}`);
  console.log(`- Réponses détaillées : ${plan.answersEligible}`);
  console.log(`- Noms participants : ${plan.participantNamesEligible}`);
  console.log(`- Emails participants : ${plan.participantEmailsEligible}`);
  console.log(
    `\nDéjà purgées / sans réponses : ${plan.attemptsAlreadyPurgedOrNoAnswers}`,
  );
  console.log(`\nIgnorés :`);
  console.log(`- Pro actif : ${plan.linksSkippedPro}`);
  console.log(`- Déblocage actif : ${plan.linksSkippedUnlock}`);
  console.log(`- Pas encore expiré / skip sécurité : ${plan.linksSkippedNotExpired}`);
}

function printVerbosePlanEntries(
  plan: ExpiredQuizDetailsPurgePlanSummary,
): void {
  console.log(`\nDétails (verbose) — liens éligibles:`);
  for (const entry of plan.eligibleEntries) {
    console.log(
      `- quizId=${entry.quizId} | "${entry.quizTitle ?? "—"}" | quizLinkId=${entry.quizLinkId}`,
    );
    console.log(
      `  acceptingResponsesUntil=${entry.acceptingResponsesUntil.toISOString()} | purgeEligibleAt=${entry.purgeEligibleAt.toISOString()}`,
    );
    console.log(
      `  attempts=${entry.counts.attemptsEligible} | answers=${entry.counts.answersEligible} | names=${entry.counts.participantNamesEligible} | emails=${entry.counts.participantEmailsEligible}`,
    );
  }
}

export async function applyExpiredQuizDetailsPurgePlan(
  plan: ExpiredQuizDetailsPurgePlanSummary,
  now = new Date(),
  verbose = false,
): Promise<PurgeApplySummary> {
  const summary: PurgeApplySummary = {
    linksPurged: 0,
    attemptsAnonymized: 0,
    answersDeleted: 0,
    participantNamesCleared: 0,
    participantEmailsCleared: 0,
  };

  for (const entry of plan.eligibleEntries) {
    const attemptIds = await findEligibleAttemptIdsForQuizLink(entry.quizLinkId);
    const result = await purgeQuizLinkDetailedResponses(
      entry.quizLinkId,
      attemptIds,
      now,
    );

    if (result.detailsPurgedAt != null) {
      summary.linksPurged += 1;
    }

    summary.attemptsAnonymized += result.attemptsAnonymized;
    summary.answersDeleted += result.answersDeleted;
    summary.participantNamesCleared += result.participantNamesCleared;
    summary.participantEmailsCleared += result.participantEmailsCleared;

    if (verbose) {
      console.log(
        `- "${entry.quizTitle ?? "—"}" | quizLinkId=${entry.quizLinkId} | answersDeleted=${result.answersDeleted} | attemptsAnonymized=${result.attemptsAnonymized} | detailsPurgedAt=${result.detailsPurgedAt?.toISOString() ?? "-"}`,
      );
    }
  }

  return summary;
}

export async function runPurgeExpiredQuizDetails(
  options: PurgeExpiredQuizDetailsOptions,
): Promise<void> {
  const now = new Date();
  const plan = await buildExpiredQuizDetailsPurgePlan(options, now);

  printPlanSummary(plan, options, now);

  if (options.verbose) {
    printVerbosePlanEntries(plan);
  }

  if (options.mode === "dry-run") {
    console.log(
      `\nDry-run terminé. Aucune donnée modifiée. Relancez avec --apply --quizId=xxx pour purger un quiz.`,
    );
    return;
  }

  console.log(`\nApplication de la purge...`);
  const applySummary = await applyExpiredQuizDetailsPurgePlan(
    plan,
    now,
    options.verbose,
  );

  console.log(`\nRésumé apply :`);
  console.log(`- Liens purgés : ${applySummary.linksPurged}`);
  console.log(`- Parties anonymisées : ${applySummary.attemptsAnonymized}`);
  console.log(`- Réponses détaillées supprimées : ${applySummary.answersDeleted}`);
  console.log(`- Noms effacés : ${applySummary.participantNamesCleared}`);
  console.log(`- Emails effacés : ${applySummary.participantEmailsCleared}`);
}

const isDirectExecution =
  typeof process.argv[1] === "string" &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
  runPurgeExpiredQuizDetails(parsePurgeExpiredQuizDetailsOptions(process.argv.slice(2)))
    .catch((error) => {
      console.error("Erreur purge quiz details:", error);
      printPurgeExpiredQuizDetailsUsage();
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
