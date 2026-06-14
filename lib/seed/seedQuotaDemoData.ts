import crypto from "node:crypto";

export const SEED_QUOTA_DEMO_TITLE_PREFIX = "[SEED QUOTA DEMO]";

export type SeedQuotaDemoScenarioKey =
  | "FREE_EMPTY"
  | "FREE_IN_PROGRESS"
  | "FREE_LIMIT_REACHED"
  | "LEGACY_OVER_LIMIT"
  | "COINS_UNLOCKED"
  | "PRO_ACTIVE"
  | "PRO_EXPIRED"
  | "DETAILS_PURGED";

export type SeedQuotaDemoOptions = {
  ownerEmail: string;
  reset: boolean;
  withProOwner: boolean;
  verbose: boolean;
};

export type SeedLinkDates = {
  responsesStartedAt: Date | null;
  detailsPurgedAt: Date | null;
};

export type SeedQuotaDemoScenarioDefinition = {
  key: SeedQuotaDemoScenarioKey;
  titleSuffix: string;
  owner: "normal" | "pro";
  targetCompletedCount: number;
  abandonedCount: number;
  notStarted?: boolean;
  withCoinUnlock?: boolean;
  withExpiredSubscriptionOnOwner?: boolean;
  purgeDetailsAfterSeed?: boolean;
};

export const SEED_QUOTA_DEMO_SCENARIOS: readonly SeedQuotaDemoScenarioDefinition[] = [
  {
    key: "FREE_EMPTY",
    titleSuffix: "0/20 — Gratuit vide",
    owner: "normal",
    targetCompletedCount: 0,
    abandonedCount: 0,
    notStarted: true,
  },
  {
    key: "FREE_IN_PROGRESS",
    titleSuffix: "12/20 — Gratuit en cours",
    owner: "normal",
    targetCompletedCount: 12,
    abandonedCount: 3,
  },
  {
    key: "FREE_LIMIT_REACHED",
    titleSuffix: "20/20 — Limite atteinte",
    owner: "normal",
    targetCompletedCount: 20,
    abandonedCount: 3,
  },
  {
    key: "LEGACY_OVER_LIMIT",
    titleSuffix: "25/20 — Legacy dépassé",
    owner: "normal",
    targetCompletedCount: 25,
    abandonedCount: 2,
  },
  {
    key: "COINS_UNLOCKED",
    titleSuffix: "Débloqué coins (25+)",
    owner: "normal",
    targetCompletedCount: 28,
    abandonedCount: 2,
    withCoinUnlock: true,
  },
  {
    key: "PRO_ACTIVE",
    titleSuffix: "Owner Pro actif",
    owner: "pro",
    targetCompletedCount: 30,
    abandonedCount: 2,
  },
  {
    key: "PRO_EXPIRED",
    titleSuffix: "Pro expiré",
    owner: "normal",
    targetCompletedCount: 22,
    abandonedCount: 2,
    withExpiredSubscriptionOnOwner: true,
  },
  {
    key: "DETAILS_PURGED",
    titleSuffix: "Détails purgés",
    owner: "normal",
    targetCompletedCount: 15,
    abandonedCount: 0,
    purgeDetailsAfterSeed: true,
  },
] as const;

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function buildSeedQuizTitle(titleSuffix: string): string {
  return `${SEED_QUOTA_DEMO_TITLE_PREFIX} ${titleSuffix}`;
}

export function isSeedQuotaDemoQuizTitle(name: string): boolean {
  return name.startsWith(SEED_QUOTA_DEMO_TITLE_PREFIX);
}

export function deriveProOwnerEmail(ownerEmail: string): string {
  const atIndex = ownerEmail.indexOf("@");
  if (atIndex <= 0) {
    return `pro-${ownerEmail}`;
  }
  const localPart = ownerEmail.slice(0, atIndex);
  const domain = ownerEmail.slice(atIndex + 1);
  return `pro-${localPart}@${domain}`;
}

export function buildSeedLinkDates(
  now: Date,
  scenario: SeedQuotaDemoScenarioDefinition,
): SeedLinkDates {
  if (scenario.notStarted) {
    return {
      responsesStartedAt: null,
      detailsPurgedAt: null,
    };
  }

  return {
    responsesStartedAt: addDays(now, -10),
    detailsPurgedAt: null,
  };
}

export function generateSeedLinkToken(seedKey: string): string {
  const hash = crypto.createHash("sha256").update(seedKey).digest("base64url");
  return hash.slice(0, 12);
}

export function buildSeedLinkTokenForQuiz(quizId: string): string {
  return generateSeedLinkToken(`seed-quota-demo:link:${quizId}`);
}

export function assertSeedQuotaDemoEnvironmentAllowed(): void {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_QUOTA_DEMO_SEED !== "1"
  ) {
    throw new Error(
      "Seed quota demo désactivé en production. Définissez ALLOW_QUOTA_DEMO_SEED=1 pour forcer.",
    );
  }
}

export function parseSeedQuotaDemoOptions(argv: string[]): SeedQuotaDemoOptions {
  const ownerEmailArg = argv.find((arg) => arg.startsWith("--ownerEmail="));
  const ownerEmail = ownerEmailArg?.slice("--ownerEmail=".length).trim();

  if (!ownerEmail) {
    throw new Error("--ownerEmail est obligatoire (ex: --ownerEmail=test@example.com)");
  }

  return {
    ownerEmail,
    reset: argv.includes("--reset"),
    withProOwner: argv.includes("--withProOwner") || !argv.includes("--skipProOwner"),
    verbose: argv.includes("--verbose"),
  };
}

export function resolveSeedScenarios(
  withProOwner: boolean,
): readonly SeedQuotaDemoScenarioDefinition[] {
  if (withProOwner) {
    return SEED_QUOTA_DEMO_SCENARIOS;
  }
  return SEED_QUOTA_DEMO_SCENARIOS.filter((scenario) => scenario.owner !== "pro");
}

export type AttemptSeedSpec = {
  status: "COMPLETED" | "ABANDONED";
  score: number | null;
  durationSeconds: number | null;
  participantName: string | null;
  participantEmail: string | null;
  identityMode: "ANONYMOUS" | "NAME_EMAIL";
  answerAllQuestions: boolean;
  partialAnswerCount: number;
};

export function buildAttemptSpecsForQuota(
  scenario: SeedQuotaDemoScenarioDefinition,
): AttemptSeedSpec[] {
  const specs: AttemptSeedSpec[] = [];

  for (let index = 0; index < scenario.targetCompletedCount; index += 1) {
    specs.push({
      status: "COMPLETED",
      score: 40 + (index % 5) * 12,
      durationSeconds: 90 + index * 15,
      participantName: `Quota Demo Joueur ${index + 1}`,
      participantEmail: `quota-demo-${index + 1}@example.com`,
      identityMode: "NAME_EMAIL",
      answerAllQuestions: true,
      partialAnswerCount: 0,
    });
  }

  for (let index = 0; index < scenario.abandonedCount; index += 1) {
    specs.push({
      status: "ABANDONED",
      score: null,
      durationSeconds: 45 + index * 10,
      participantName: `Quota Demo Abandon ${index + 1}`,
      participantEmail: `quota-abandon-${index + 1}@example.com`,
      identityMode: "NAME_EMAIL",
      answerAllQuestions: false,
      partialAnswerCount: 2,
    });
  }

  return specs;
}
