/**
 * [DEV / STAGING] Seed de démonstration pour tester le modèle quota (20 réponses gratuites).
 *
 * Usage :
 *   npx tsx scripts/seed-quota-demo-data.ts --ownerEmail=test@example.com
 *   npx tsx scripts/seed-quota-demo-data.ts --ownerEmail=test@example.com --reset --verbose
 *
 * Ne jamais lancer automatiquement. Bloqué en production sauf ALLOW_QUOTA_DEMO_SEED=1.
 */

import "./load-env-bootstrap";

import { pathToFileURL } from "node:url";

import bcrypt from "bcryptjs";
import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "../lib/prisma";
import {
  buildQuizAggregatesFromHistory,
  type HistoricalAnswerInput,
  type HistoricalAttemptInput,
} from "../lib/quiz/buildQuizResponseAggregatesFromHistory";
import {
  addDays,
  assertSeedQuotaDemoEnvironmentAllowed,
  buildAttemptSpecsForQuota,
  buildSeedLinkDates,
  buildSeedLinkTokenForQuiz,
  buildSeedQuizTitle,
  deriveProOwnerEmail,
  generateSeedLinkToken,
  isSeedQuotaDemoQuizTitle,
  parseSeedQuotaDemoOptions,
  resolveSeedScenarios,
  SEED_QUOTA_DEMO_SCENARIOS,
  SEED_QUOTA_DEMO_TITLE_PREFIX,
  type AttemptSeedSpec,
  type SeedQuotaDemoScenarioDefinition,
  type SeedQuotaDemoScenarioKey,
} from "../lib/seed/seedQuotaDemoData";
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
  scenarioKey: SeedQuotaDemoScenarioKey;
  titleSuffix: string;
  quizId: string;
  quizLinkId: string;
  linkToken: string;
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
    token = generateSeedLinkToken(`seed-quota-demo:link:${quizId}:${attempt}`);
  }

  throw new Error(`Impossible d'allouer un token unique pour le quiz ${quizId}`);
}

async function findExistingSeedQuizForOwner(params: {
  ownerId: string;
  scenario: SeedQuotaDemoScenarioDefinition;
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
        select: { id: true, token: true },
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
    linkToken: quiz.links[0]!.token,
    skippedExisting: true,
  };
}

export function printSeedQuotaDemoUsage(): void {
  console.log(`Usage:
  npx tsx scripts/seed-quota-demo-data.ts --ownerEmail=test@example.com [--reset] [--verbose]
  npx tsx scripts/seed-quota-demo-data.ts --ownerEmail=test@example.com --withProOwner

Options:
  --ownerEmail=xxx   Email du owner principal (obligatoire)
  --reset            Supprime uniquement les quiz préfixés "${SEED_QUOTA_DEMO_TITLE_PREFIX}"
  --withProOwner     Inclut le scénario Owner Pro actif (défaut: inclus)
  --skipProOwner     Exclut le scénario Owner Pro actif
  --verbose          Logs détaillés

Sécurité:
  Bloqué en production sauf ALLOW_QUOTA_DEMO_SEED=1
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
  const stripeSubscriptionId = `seed_quota_demo_pro_${userId}`;

  const existing = await prisma.userSubscription.findFirst({
    where: { userId },
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

async function ensureExpiredProSubscription(userId: string, now: Date): Promise<void> {
  const periodStart = addDays(now, -60);
  const periodEnd = addDays(now, -30);
  const stripeSubscriptionId = `seed_quota_demo_pro_expired_${userId}`;

  const existing = await prisma.userSubscription.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (existing) {
    await prisma.userSubscription.update({
      where: { id: existing.id },
      data: {
        status: "CANCELED",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: true,
        canceledAt: periodEnd,
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
      status: "CANCELED",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: true,
      canceledAt: periodEnd,
    },
  });
}

export async function deleteSeedQuotaDemoQuizzes(verbose = false): Promise<number> {
  const seedQuizzes = await prisma.quiz.findMany({
    where: {
      name: { startsWith: SEED_QUOTA_DEMO_TITLE_PREFIX },
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

async function createAttemptAnswers(params: {
  attemptId: string;
  questions: CreatedQuestion[];
  spec: AttemptSeedSpec;
  startedAt: Date;
}): Promise<void> {
  const answerCount = params.spec.answerAllQuestions
    ? params.questions.length
    : params.spec.partialAnswerCount;

  for (let answerIndex = 0; answerIndex < answerCount; answerIndex += 1) {
    const question = params.questions[answerIndex]!;
    const correctOption = question.options.find((option) => option.isCorrect);
    const incorrectOption = question.options.find((option) => !option.isCorrect);
    const pickCorrect = params.spec.status === "COMPLETED" && answerIndex % 2 === 0;
    const selectedOptionId = pickCorrect
      ? (correctOption?.id ?? question.options[0]!.id)
      : (incorrectOption?.id ?? question.options[0]!.id);

    await prisma.quizAnswer.create({
      data: {
        attemptId: params.attemptId,
        questionId: question.id,
        selectedOptionIds: [selectedOptionId],
        isCorrect: pickCorrect,
        expired: false,
        timeSpent: 10 + answerIndex * 3,
        answeredAt: new Date(params.startedAt.getTime() + (answerIndex + 1) * 15_000),
      },
    });
  }
}

async function createSeedAttempts(params: {
  quizLinkId: string;
  questions: CreatedQuestion[];
  scenario: SeedQuotaDemoScenarioDefinition;
  responsesStartedAt: Date;
}): Promise<void> {
  const specs = buildAttemptSpecsForQuota(params.scenario);

  for (let index = 0; index < specs.length; index += 1) {
    const spec = specs[index]!;
    const startedAt = addDays(params.responsesStartedAt, index);
    const finishedAt = new Date(startedAt.getTime() + (spec.durationSeconds ?? 60) * 1000);

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

    await createAttemptAnswers({
      attemptId: attempt.id,
      questions: params.questions,
      spec,
      startedAt,
    });
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

async function createPermanentCoinsUnlock(params: {
  quizId: string;
  userId: string;
  now: Date;
}): Promise<void> {
  const existing = await prisma.quizUnlock.findFirst({
    where: {
      quizId: params.quizId,
      userId: params.userId,
      source: "COINS",
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.quizUnlock.update({
      where: { id: existing.id },
      data: {
        expiresAt: null,
        startsAt: params.now,
      },
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
      expiresAt: null,
    },
  });
}

async function purgeQuizDetails(params: {
  quizId: string;
  quizLinkId: string;
  now: Date;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.quizAnswer.deleteMany({
      where: { attempt: { quizLink: { quizId: params.quizId } } },
    });
    await tx.quizAttemptQuestion.deleteMany({
      where: { attempt: { quizLink: { quizId: params.quizId } } },
    });
    await tx.quizLink.update({
      where: { id: params.quizLinkId },
      data: {
        detailsPurgedAt: addDays(params.now, -1),
      },
    });
  });
}

async function createSeedQuiz(params: {
  scenario: SeedQuotaDemoScenarioDefinition;
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
        console.log(
          `  ↷ ${buildSeedQuizTitle(params.scenario.titleSuffix)} (${existing.quizId}) — déjà présent`,
        );
      }
      return existing;
    }
  }

  const linkDates = buildSeedLinkDates(params.now, params.scenario);
  const title = buildSeedQuizTitle(params.scenario.titleSuffix);

  const quiz = await prisma.quiz.create({
    data: {
      ownerId: params.ownerId,
      name: title,
      visibility: "PRIVATE",
      status: "ACTIVE",
      publishedAt: linkDates.responsesStartedAt,
      settings: {
        participantIdentityMode: "NAME_EMAIL",
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
      responsesStartedAt: linkDates.responsesStartedAt,
      detailsPurgedAt: linkDates.detailsPurgedAt,
      lastResponseAt:
        linkDates.responsesStartedAt != null ? addDays(linkDates.responsesStartedAt, 3) : null,
    },
    select: { id: true },
  });

  const questions = await createSeedQuestions(quiz.id);

  if (linkDates.responsesStartedAt != null && params.scenario.targetCompletedCount > 0) {
    await createSeedAttempts({
      quizLinkId: quizLink.id,
      questions,
      scenario: params.scenario,
      responsesStartedAt: linkDates.responsesStartedAt,
    });
  }

  if (params.scenario.withCoinUnlock) {
    await createPermanentCoinsUnlock({
      quizId: quiz.id,
      userId: params.ownerId,
      now: params.now,
    });
  }

  await backfillAggregatesForQuiz(quiz.id);

  if (params.scenario.purgeDetailsAfterSeed) {
    await purgeQuizDetails({
      quizId: quiz.id,
      quizLinkId: quizLink.id,
      now: params.now,
    });
  }

  if (params.verbose) {
    console.log(`  ✓ ${title} (${quiz.id})`);
  }

  return {
    scenarioKey: params.scenario.key,
    titleSuffix: params.scenario.titleSuffix,
    quizId: quiz.id,
    quizLinkId: quizLink.id,
    linkToken: token,
    skippedExisting: false,
  };
}

export type SeedQuotaDemoRunSummary = {
  normalOwner: SeedUserRecord;
  proOwner: SeedUserRecord | null;
  createdQuizzes: CreatedSeedQuiz[];
  deletedQuizCount: number;
};

export async function runSeedQuotaDemoData(
  options: ReturnType<typeof parseSeedQuotaDemoOptions>,
): Promise<SeedQuotaDemoRunSummary> {
  assertSeedQuotaDemoEnvironmentAllowed();

  const now = new Date();
  let deletedQuizCount = 0;

  if (options.reset) {
    deletedQuizCount = await deleteSeedQuotaDemoQuizzes(options.verbose);
    if (options.verbose) {
      console.log(`Reset: ${deletedQuizCount} quiz seed quota supprimé(s).`);
    }
  }

  const normalOwner = await ensureDemoUser({
    email: options.ownerEmail,
    name: "Quota Demo Owner",
    coinBalance: 200,
  });

  let proOwner: SeedUserRecord | null = null;
  if (options.withProOwner) {
    const proEmail = deriveProOwnerEmail(options.ownerEmail);
    proOwner = await ensureDemoUser({
      email: proEmail,
      name: "Quota Demo Pro Owner",
      coinBalance: 0,
    });
    await ensureProSubscription(proOwner.id, now);
  }

  const proExpiredScenario = SEED_QUOTA_DEMO_SCENARIOS.find(
    (scenario) => scenario.key === "PRO_EXPIRED",
  );
  if (proExpiredScenario != null) {
    await ensureExpiredProSubscription(normalOwner.id, now);
  }

  const scenarios = resolveSeedScenarios(options.withProOwner);
  const createdQuizzes: CreatedSeedQuiz[] = [];

  if (options.verbose) {
    console.log("Création des quiz seed quota...");
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

function printSeedSummary(summary: SeedQuotaDemoRunSummary): void {
  console.log("\nSeed quota demo créé :\n");

  console.log("Owner normal :");
  console.log(`- email : ${summary.normalOwner.email}`);
  console.log(`- userId : ${summary.normalOwner.id}`);

  if (summary.proOwner) {
    console.log("\nOwner Pro actif :");
    console.log(`- email : ${summary.proOwner.email}`);
    console.log(`- userId : ${summary.proOwner.id}`);
  }

  console.log("\nQuiz créés :");
  for (const quiz of summary.createdQuizzes) {
    const suffix = quiz.skippedExisting ? " (déjà existant)" : "";
    console.log(`- ${quiz.titleSuffix}${suffix}`);
    console.log(`  dashboard : /dashboard/quiz/${quiz.quizId}`);
    console.log(`  public    : /quiz/${quiz.linkToken}`);
  }

  if (summary.deletedQuizCount > 0) {
    console.log(
      `\nReset : ${summary.deletedQuizCount} quiz seed quota supprimé(s) avant recréation.`,
    );
  }

  console.log("\nMot de passe démo (nouveaux users) : password123");
}

const isDirectExecution =
  typeof process.argv[1] === "string" &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
  runSeedQuotaDemoData(parseSeedQuotaDemoOptions(process.argv.slice(2)))
    .then((summary) => {
      printSeedSummary(summary);
    })
    .catch((error) => {
      console.error("Erreur seed quota demo:", error);
      printSeedQuotaDemoUsage();
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { isSeedQuotaDemoQuizTitle, printSeedSummary };
