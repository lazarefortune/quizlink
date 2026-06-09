/**
 * [DEV / STAGING] Seed de démonstration pour tester purge, expiration, paywall et parties purgées.
 *
 * Usage :
 *   npx tsx scripts/seed-purge-demo-data.ts --ownerEmail=test@example.com
 *   npx tsx scripts/seed-purge-demo-data.ts --ownerEmail=test@example.com --reset --verbose
 *
 * Ne jamais lancer automatiquement. Bloqué en production sauf ALLOW_PURGE_DEMO_SEED=1.
 */

import { pathToFileURL } from "node:url";

import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";
import {
  buildQuizAggregatesFromHistory,
  type HistoricalAnswerInput,
  type HistoricalAttemptInput,
} from "../lib/quiz/buildQuizResponseAggregatesFromHistory";
import {
  addDays,
  assertSeedPurgeDemoEnvironmentAllowed,
  buildSeedCampaignDates,
  buildSeedLinkTokenForQuiz,
  buildSeedQuizTitle,
  deriveProOwnerEmail,
  generateSeedLinkToken,
  isSeedPurgeDemoQuizTitle,
  parseSeedPurgeDemoOptions,
  resolveSeedScenarios,
  SEED_PURGE_DEMO_TITLE_PREFIX,
  type SeedPurgeDemoScenarioDefinition,
  type SeedPurgeDemoScenarioKey,
} from "../lib/seed/seedPurgeDemoData";
import { applyQuizAggregatesBackfill } from "./backfill-quiz-response-aggregates";

const DEMO_PASSWORD = "password123";
const QUESTION_COUNT = 5;
const OPTION_COUNT = 4;

type SeedUserRecord = {
  id: string;
  email: string;
};

type CreatedQuestion = {
  id: string;
  options: Array<{ id: string; isCorrect: boolean }>;
};

type CreatedSeedQuiz = {
  scenarioKey: SeedPurgeDemoScenarioKey;
  titleSuffix: string;
  quizId: string;
  quizLinkId: string;
  skippedExisting: boolean;
};

async function allocateUniqueSeedLinkToken(quizId: string): Promise<string> {
  let token = buildSeedLinkTokenForQuiz(quizId);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const existing = await prisma.quizLink.findUnique({
      where: { token },
      select: { id: true },
    });
    if (!existing) {
      return token;
    }
    token = generateSeedLinkToken(`seed-purge-demo:link:${quizId}:${attempt}`);
  }

  throw new Error(`Impossible d'allouer un token unique pour le quiz ${quizId}`);
}

async function findExistingSeedQuizForOwner(params: {
  ownerId: string;
  scenario: SeedPurgeDemoScenarioDefinition;
}): Promise<CreatedSeedQuiz | null> {
  const title = buildSeedQuizTitle(params.scenario.titleSuffix);
  const quiz = await prisma.quiz.findFirst({
    where: {
      ownerId: params.ownerId,
      name: title,
    },
    select: {
      id: true,
      links: {
        where: { participantId: null },
        take: 1,
        select: { id: true },
      },
    },
  });

  if (quiz == null || quiz.links.length === 0) {
    return null;
  }

  return {
    scenarioKey: params.scenario.key,
    titleSuffix: params.scenario.titleSuffix,
    quizId: quiz.id,
    quizLinkId: quiz.links[0]!.id,
    skippedExisting: true,
  };
}

export function printSeedPurgeDemoUsage(): void {
  console.log(`Usage:
  npx tsx scripts/seed-purge-demo-data.ts --ownerEmail=test@example.com [--reset] [--verbose]
  npx tsx scripts/seed-purge-demo-data.ts --ownerEmail=test@example.com --withProOwner

Options:
  --ownerEmail=xxx   Email du owner principal (obligatoire)
  --reset            Supprime uniquement les quiz préfixés "${SEED_PURGE_DEMO_TITLE_PREFIX}"
  --withProOwner     Inclut le scénario Owner Pro (défaut: inclus)
  --skipProOwner     Exclut le scénario Owner Pro
  --verbose          Logs détaillés

Sécurité:
  Bloqué en production sauf ALLOW_PURGE_DEMO_SEED=1
`);
}

async function ensureDemoUser(params: {
  email: string;
  name: string;
  coinBalance?: number;
}): Promise<SeedUserRecord> {
  const existing = await prisma.user.findUnique({
    where: { email: params.email },
    select: { id: true, email: true },
  });

  if (existing) {
    return existing;
  }

  const now = new Date();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const created = await prisma.user.create({
    data: {
      email: params.email,
      name: params.name,
      passwordHash,
      emailVerifiedAt: now,
      coinBalance: params.coinBalance ?? 100,
      termsAcceptedAt: now,
      termsVersion: "1",
      privacyAcceptedAt: now,
      privacyVersion: "1",
    },
    select: { id: true, email: true },
  });

  return created;
}

async function ensureProSubscription(userId: string, now: Date): Promise<void> {
  const periodEnd = addDays(now, 30);
  const stripeSubscriptionId = `seed_purge_demo_pro_${userId}`;

  const existing = await prisma.userSubscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "TRIALING"] },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.userSubscription.update({
      where: { id: existing.id },
      data: {
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
    });
    return;
  }

  await prisma.userSubscription.create({
    data: {
      userId,
      provider: "STRIPE",
      stripeSubscriptionId,
      plan: "PRO",
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });
}

export async function deleteSeedPurgeDemoQuizzes(verbose = false): Promise<number> {
  const seedQuizzes = await prisma.quiz.findMany({
    where: {
      name: { startsWith: SEED_PURGE_DEMO_TITLE_PREFIX },
    },
    select: { id: true, name: true },
  });

  if (verbose) {
    for (const quiz of seedQuizzes) {
      console.log(`  - supprime ${quiz.name} (${quiz.id})`);
    }
  }

  for (const quiz of seedQuizzes) {
    await prisma.$transaction(async (tx) => {
      // QuizAnswer / QuizAttemptQuestion reference Question with onDelete: Restrict —
      // they must be removed before Question rows are cascade-deleted with the quiz.
      await tx.quizAnswer.deleteMany({
        where: { attempt: { quizLink: { quizId: quiz.id } } },
      });
      await tx.quizAttemptQuestion.deleteMany({
        where: { attempt: { quizLink: { quizId: quiz.id } } },
      });
      await tx.quizQuestionResponseStats.deleteMany({
        where: { quizId: quiz.id },
      });
      await tx.quizResponseStats.deleteMany({
        where: { quizId: quiz.id },
      });
      await tx.quizUnlock.deleteMany({
        where: { quizId: quiz.id },
      });
      await tx.quiz.delete({ where: { id: quiz.id } });
    });
  }

  return seedQuizzes.length;
}

async function createSeedQuestions(quizId: string): Promise<CreatedQuestion[]> {
  const questions: CreatedQuestion[] = [];

  for (let questionIndex = 0; questionIndex < QUESTION_COUNT; questionIndex += 1) {
    const created = await prisma.question.create({
      data: {
        quizId,
        type: "MULTIPLE_CHOICE",
        label: `Question seed ${questionIndex + 1}`,
        order: questionIndex + 1,
        options: {
          create: Array.from({ length: OPTION_COUNT }, (_, optionIndex) => ({
            label: `Option ${optionIndex + 1}`,
            isCorrect: optionIndex === 0,
          })),
        },
      },
      select: {
        id: true,
        options: {
          select: { id: true, isCorrect: true },
          orderBy: { id: "asc" },
        },
      },
    });

    questions.push(created);
  }

  return questions;
}

type AttemptSeedSpec = {
  status: "COMPLETED" | "ABANDONED" | "IN_PROGRESS";
  score: number | null;
  durationSeconds: number | null;
  participantName: string | null;
  participantEmail: string | null;
  identityMode: "ANONYMOUS" | "NAME_EMAIL";
  answerAllQuestions: boolean;
  partialAnswerCount: number;
};

function buildAttemptSpecs(scenario: SeedPurgeDemoScenarioKey): AttemptSeedSpec[] {
  const useAnonymous = scenario === "ALREADY_PURGED";

  const completedScores = [40, 60, 80, 100];
  const specs: AttemptSeedSpec[] = completedScores.map((score, index) => ({
    status: "COMPLETED",
    score,
    durationSeconds: 90 + index * 30,
    participantName: useAnonymous ? null : `Demo Joueur ${index + 1}`,
    participantEmail: useAnonymous ? null : `demo${index + 1}@purge-demo.local`,
    identityMode: useAnonymous ? "ANONYMOUS" : "NAME_EMAIL",
    answerAllQuestions: !useAnonymous,
    partialAnswerCount: 0,
  }));

  specs.push(
    {
      status: "COMPLETED",
      score: 70,
      durationSeconds: 180,
      participantName: useAnonymous ? null : "Demo Joueur 5",
      participantEmail: useAnonymous ? null : "demo5@purge-demo.local",
      identityMode: useAnonymous ? "ANONYMOUS" : "NAME_EMAIL",
      answerAllQuestions: !useAnonymous,
      partialAnswerCount: 0,
    },
    {
      status: "ABANDONED",
      score: null,
      durationSeconds: 45,
      participantName: useAnonymous ? null : "Demo Abandon 1",
      participantEmail: useAnonymous ? null : "abandon1@purge-demo.local",
      identityMode: useAnonymous ? "ANONYMOUS" : "NAME_EMAIL",
      answerAllQuestions: false,
      partialAnswerCount: useAnonymous ? 0 : 2,
    },
    {
      status: "ABANDONED",
      score: null,
      durationSeconds: 30,
      participantName: useAnonymous ? null : "Demo Abandon 2",
      participantEmail: useAnonymous ? null : "abandon2@purge-demo.local",
      identityMode: useAnonymous ? "ANONYMOUS" : "NAME_EMAIL",
      answerAllQuestions: false,
      partialAnswerCount: useAnonymous ? 0 : 1,
    },
    {
      status: "IN_PROGRESS",
      score: null,
      durationSeconds: null,
      participantName: useAnonymous ? null : "Demo En cours",
      participantEmail: useAnonymous ? null : "progress@purge-demo.local",
      identityMode: useAnonymous ? "ANONYMOUS" : "NAME_EMAIL",
      answerAllQuestions: false,
      partialAnswerCount: 0,
    },
  );

  return specs;
}

async function createSeedAttempts(params: {
  quizLinkId: string;
  questions: CreatedQuestion[];
  scenario: SeedPurgeDemoScenarioKey;
  campaignStartedAt: Date;
}): Promise<void> {
  const specs = buildAttemptSpecs(params.scenario);

  for (let index = 0; index < specs.length; index += 1) {
    const spec = specs[index]!;
    const startedAt = addDays(params.campaignStartedAt, index);
    const finishedAt =
      spec.status === "IN_PROGRESS"
        ? null
        : new Date(startedAt.getTime() + (spec.durationSeconds ?? 60) * 1000);

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizLinkId: params.quizLinkId,
        status: spec.status,
        score: spec.score,
        startedAt,
        finishedAt,
        durationSeconds: spec.durationSeconds,
        totalQuestions: QUESTION_COUNT,
        identityMode: spec.identityMode,
        participantName: spec.participantName,
        participantEmail: spec.participantEmail,
      },
      select: { id: true },
    });

    if (params.scenario === "ALREADY_PURGED") {
      continue;
    }

    const answerCount = spec.answerAllQuestions
      ? params.questions.length
      : spec.partialAnswerCount;

    for (let answerIndex = 0; answerIndex < answerCount; answerIndex += 1) {
      const question = params.questions[answerIndex]!;
      const correctOption = question.options.find((option) => option.isCorrect);
      const incorrectOption = question.options.find((option) => !option.isCorrect);
      const pickCorrect = spec.status === "COMPLETED" && answerIndex % 2 === 0;
      const selectedOptionId = pickCorrect
        ? (correctOption?.id ?? question.options[0]!.id)
        : (incorrectOption?.id ?? question.options[0]!.id);

      await prisma.quizAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: question.id,
          selectedOptionIds: [selectedOptionId],
          isCorrect: pickCorrect,
          expired: false,
          timeSpent: 10 + answerIndex * 3,
          answeredAt: new Date(startedAt.getTime() + (answerIndex + 1) * 15_000),
        },
      });
    }
  }
}

async function loadHistoricalAttemptsForQuiz(
  quizId: string,
): Promise<HistoricalAttemptInput[]> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { quizLink: { quizId } },
    select: {
      id: true,
      status: true,
      score: true,
      totalQuestions: true,
      durationSeconds: true,
      _count: { select: { answers: true } },
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

async function backfillAggregatesForQuiz(quizId: string): Promise<void> {
  const attempts = await loadHistoricalAttemptsForQuiz(quizId);
  const answers = await loadHistoricalAnswersForCompletedAttempts(quizId);
  const built = buildQuizAggregatesFromHistory({
    quizId,
    attempts,
    answersFromCompletedAttempts: answers,
  });
  await applyQuizAggregatesBackfill(built);
}

async function createCoinsUnlock(params: {
  quizId: string;
  userId: string;
  now: Date;
  expiresAt: Date;
}): Promise<void> {
  const existing = await prisma.quizUnlock.findFirst({
    where: {
      quizId: params.quizId,
      userId: params.userId,
      expiresAt: { gt: params.now },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.quizUnlock.update({
      where: { id: existing.id },
      data: { expiresAt: params.expiresAt },
    });
    return;
  }

  await prisma.quizUnlock.create({
    data: {
      quizId: params.quizId,
      userId: params.userId,
      type: "SINGLE_QUIZ",
      source: "COINS",
      coinsSpent: 40,
      startsAt: params.now,
      expiresAt: params.expiresAt,
    },
  });
}

async function createSeedQuiz(params: {
  scenario: SeedPurgeDemoScenarioDefinition;
  ownerId: string;
  now: Date;
  verbose: boolean;
  skipIfExists: boolean;
}): Promise<CreatedSeedQuiz | null> {
  if (params.skipIfExists) {
    const existing = await findExistingSeedQuizForOwner({
      ownerId: params.ownerId,
      scenario: params.scenario,
    });
    if (existing != null) {
      if (params.verbose) {
        console.log(`  ↷ ${buildSeedQuizTitle(params.scenario.titleSuffix)} (${existing.quizId}) — déjà présent`);
      }
      return existing;
    }
  }

  const campaign = buildSeedCampaignDates(params.now, params.scenario.key);
  const title = buildSeedQuizTitle(params.scenario.titleSuffix);

  const identityMode = params.scenario.key === "ALREADY_PURGED" ? "ANONYMOUS" : "NAME_EMAIL";

  const quiz = await prisma.quiz.create({
    data: {
      ownerId: params.ownerId,
      name: title,
      visibility: "PRIVATE",
      status: "ACTIVE",
      publishedAt: campaign.responsesStartedAt,
      settings: {
        participantIdentityMode: identityMode,
        showAnswerImmediately: false,
        showAnswersAtEnd: true,
        randomizeQuestions: false,
        randomizeOptions: false,
        timeLimitPerQuestion: null,
        autoSaveEnabled: true,
      } satisfies Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  const token = await allocateUniqueSeedLinkToken(quiz.id);

  const quizLink = await prisma.quizLink.create({
    data: {
      quizId: quiz.id,
      token,
      participantId: null,
      allowMultipleAttempts: true,
      responsesStartedAt: campaign.responsesStartedAt,
      acceptingResponsesUntil: campaign.acceptingResponsesUntil,
      detailsVisibleUntil: campaign.detailsVisibleUntil,
      detailsPurgedAt: campaign.detailsPurgedAt,
      unlockedUntil: campaign.unlockedUntil,
      lastResponseAt: addDays(campaign.responsesStartedAt, 3),
    },
    select: { id: true },
  });

  const questions = await createSeedQuestions(quiz.id);

  await createSeedAttempts({
    quizLinkId: quizLink.id,
    questions,
    scenario: params.scenario.key,
    campaignStartedAt: campaign.responsesStartedAt,
  });

  if (params.scenario.key === "COINS_UNLOCKED") {
    await createCoinsUnlock({
      quizId: quiz.id,
      userId: params.ownerId,
      now: params.now,
      expiresAt: campaign.unlockedUntil ?? addDays(params.now, 30),
    });
  }

  await backfillAggregatesForQuiz(quiz.id);

  if (params.verbose) {
    console.log(`  ✓ ${title} (${quiz.id})`);
  }

  return {
    scenarioKey: params.scenario.key,
    titleSuffix: params.scenario.titleSuffix,
    quizId: quiz.id,
    quizLinkId: quizLink.id,
    skippedExisting: false,
  };
}

export type SeedPurgeDemoRunSummary = {
  normalOwner: SeedUserRecord;
  proOwner: SeedUserRecord | null;
  createdQuizzes: CreatedSeedQuiz[];
  deletedQuizCount: number;
};

export async function runSeedPurgeDemoData(
  options: ReturnType<typeof parseSeedPurgeDemoOptions>,
): Promise<SeedPurgeDemoRunSummary> {
  assertSeedPurgeDemoEnvironmentAllowed();

  const now = new Date();
  let deletedQuizCount = 0;

  if (options.reset) {
    deletedQuizCount = await deleteSeedPurgeDemoQuizzes(options.verbose);
    if (options.verbose) {
      console.log(`Reset: ${deletedQuizCount} quiz seed supprimé(s).`);
    }
  }

  const normalOwner = await ensureDemoUser({
    email: options.ownerEmail,
    name: "Purge Demo Owner",
    coinBalance: 200,
  });

  let proOwner: SeedUserRecord | null = null;
  if (options.withProOwner) {
    const proEmail = deriveProOwnerEmail(options.ownerEmail);
    proOwner = await ensureDemoUser({
      email: proEmail,
      name: "Purge Demo Pro Owner",
      coinBalance: 0,
    });
    await ensureProSubscription(proOwner.id, now);
  }

  const scenarios = resolveSeedScenarios(options.withProOwner);
  const createdQuizzes: CreatedSeedQuiz[] = [];

  if (options.verbose) {
    console.log("Création des quiz seed...");
  }

  for (const scenario of scenarios) {
    const ownerId =
      scenario.owner === "pro" && proOwner != null ? proOwner.id : normalOwner.id;

    const created = await createSeedQuiz({
      scenario,
      ownerId,
      now,
      verbose: options.verbose,
      skipIfExists: !options.reset,
    });
    if (created != null) {
      createdQuizzes.push(created);
    }
  }

  return {
    normalOwner,
    proOwner,
    createdQuizzes,
    deletedQuizCount,
  };
}

function printSeedSummary(summary: SeedPurgeDemoRunSummary): void {
  const purgeableQuiz = summary.createdQuizzes.find(
    (quiz) => quiz.scenarioKey === "PURGEABLE",
  );

  console.log("\nSeed purge demo créé :\n");

  console.log("Owner normal :");
  console.log(`- email : ${summary.normalOwner.email}`);
  console.log(`- userId : ${summary.normalOwner.id}`);

  if (summary.proOwner) {
    console.log("\nOwner Pro :");
    console.log(`- email : ${summary.proOwner.email}`);
    console.log(`- userId : ${summary.proOwner.id}`);
  }

  console.log("\nQuiz créés :");
  for (const quiz of summary.createdQuizzes) {
    const suffix = quiz.skippedExisting ? " (déjà existant)" : "";
    console.log(`- ${quiz.titleSuffix}${suffix} : /dashboard/quiz/${quiz.quizId}`);
  }

  if (summary.deletedQuizCount > 0) {
    console.log(`\nReset : ${summary.deletedQuizCount} quiz seed supprimé(s) avant recréation.`);
  }

  console.log("\nMot de passe démo (nouveaux users) : password123");

  if (purgeableQuiz) {
    console.log("\nCommandes utiles :");
    console.log(
      `npx tsx scripts/dry-run-purge-expired-quiz-details.ts --dry-run --quizId=${purgeableQuiz.quizId} --verbose`,
    );
    console.log(
      `npx tsx scripts/dry-run-purge-expired-quiz-details.ts --apply --quizId=${purgeableQuiz.quizId} --verbose`,
    );
  }
}

const isDirectExecution =
  typeof process.argv[1] === "string" &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
  runSeedPurgeDemoData(parseSeedPurgeDemoOptions(process.argv.slice(2)))
    .then((summary) => {
      printSeedSummary(summary);
    })
    .catch((error) => {
      console.error("Erreur seed purge demo:", error);
      printSeedPurgeDemoUsage();
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
