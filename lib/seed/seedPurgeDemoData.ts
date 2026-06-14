import crypto from "node:crypto";

export const SEED_PURGE_DEMO_TITLE_PREFIX = "[SEED PURGE DEMO]";

export type SeedPurgeDemoScenarioKey =
  | "QUOTA_NOT_REACHED"
  | "QUOTA_GRACE_ACTIVE"
  | "QUOTA_PURGEABLE"
  | "ALREADY_PURGED"
  | "COINS_UNLOCKED"
  | "PRO_OWNER";

export type SeedPurgeDemoOptions = {
  ownerEmail: string;
  reset: boolean;
  withProOwner: boolean;
  verbose: boolean;
};

export type SeedLinkDates = {
  responsesStartedAt: Date;
  detailsPurgedAt: Date | null;
};

export type SeedPurgeDemoScenarioDefinition = {
  key: SeedPurgeDemoScenarioKey;
  titleSuffix: string;
  owner: "normal" | "pro";
  targetCompletedCount: number;
  abandonedCount: number;
  lastResponseAgeDays: number;
  withCoinUnlock?: boolean;
  alreadyPurged?: boolean;
  skipAnswerDetails?: boolean;
};

export const SEED_PURGE_DEMO_SCENARIOS: readonly SeedPurgeDemoScenarioDefinition[] = [
  {
    key: "QUOTA_NOT_REACHED",
    titleSuffix: "Quota not reached",
    owner: "normal",
    targetCompletedCount: 12,
    abandonedCount: 0,
    lastResponseAgeDays: 45,
  },
  {
    key: "QUOTA_GRACE_ACTIVE",
    titleSuffix: "Quota grace active",
    owner: "normal",
    targetCompletedCount: 20,
    abandonedCount: 0,
    lastResponseAgeDays: 5,
  },
  {
    key: "QUOTA_PURGEABLE",
    titleSuffix: "Quota purgeable",
    owner: "normal",
    targetCompletedCount: 20,
    abandonedCount: 0,
    lastResponseAgeDays: 45,
  },
  {
    key: "ALREADY_PURGED",
    titleSuffix: "Already purged",
    owner: "normal",
    targetCompletedCount: 20,
    abandonedCount: 0,
    lastResponseAgeDays: 45,
    alreadyPurged: true,
  },
  {
    key: "COINS_UNLOCKED",
    titleSuffix: "Coins unlocked skip",
    owner: "normal",
    targetCompletedCount: 25,
    abandonedCount: 0,
    lastResponseAgeDays: 45,
    withCoinUnlock: true,
  },
  {
    key: "PRO_OWNER",
    titleSuffix: "Pro active skip",
    owner: "pro",
    targetCompletedCount: 25,
    abandonedCount: 0,
    lastResponseAgeDays: 45,
  },
] as const;

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

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function buildSeedQuizTitle(titleSuffix: string): string {
  return `${SEED_PURGE_DEMO_TITLE_PREFIX} ${titleSuffix}`;
}

export function isSeedPurgeDemoQuizTitle(name: string): boolean {
  return name.startsWith(SEED_PURGE_DEMO_TITLE_PREFIX);
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

export function buildSeedLastResponseAt(now: Date, ageDays: number): Date {
  return addDays(now, -ageDays);
}

export function buildSeedLinkDates(now: Date): SeedLinkDates {
  return {
    responsesStartedAt: addDays(now, -60),
    detailsPurgedAt: null,
  };
}

export function buildAttemptSpecsForPurgeScenario(
  scenario: SeedPurgeDemoScenarioDefinition,
): AttemptSeedSpec[] {
  const useAnonymous = scenario.skipAnswerDetails === true;
  const specs: AttemptSeedSpec[] = [];

  for (let index = 0; index < scenario.targetCompletedCount; index += 1) {
    specs.push({
      status: "COMPLETED",
      score: 40 + (index % 5) * 12,
      durationSeconds: 90 + index * 15,
      participantName: useAnonymous ? null : `Purge Demo Joueur ${index + 1}`,
      participantEmail: useAnonymous ? null : `purge-demo-${index + 1}@example.com`,
      identityMode: useAnonymous ? "ANONYMOUS" : "NAME_EMAIL",
      answerAllQuestions: !useAnonymous,
      partialAnswerCount: 0,
    });
  }

  for (let index = 0; index < scenario.abandonedCount; index += 1) {
    specs.push({
      status: "ABANDONED",
      score: null,
      durationSeconds: 45 + index * 10,
      participantName: useAnonymous ? null : `Purge Demo Abandon ${index + 1}`,
      participantEmail: useAnonymous ? null : `purge-abandon-${index + 1}@example.com`,
      identityMode: useAnonymous ? "ANONYMOUS" : "NAME_EMAIL",
      answerAllQuestions: false,
      partialAnswerCount: 2,
    });
  }

  return specs;
}

export function generateSeedLinkToken(seedKey: string): string {
  const hash = crypto.createHash("sha256").update(seedKey).digest("base64url");
  return hash.slice(0, 12);
}

export function buildSeedLinkTokenForQuiz(quizId: string): string {
  return generateSeedLinkToken(`seed-purge-demo:link:${quizId}`);
}

export function assertSeedPurgeDemoEnvironmentAllowed(): void {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_PURGE_DEMO_SEED !== "1"
  ) {
    throw new Error(
      "Seed purge demo désactivé en production. Définissez ALLOW_PURGE_DEMO_SEED=1 pour forcer.",
    );
  }
}

export function parseSeedPurgeDemoOptions(argv: string[]): SeedPurgeDemoOptions {
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
): readonly SeedPurgeDemoScenarioDefinition[] {
  if (withProOwner) {
    return SEED_PURGE_DEMO_SCENARIOS;
  }
  return SEED_PURGE_DEMO_SCENARIOS.filter((scenario) => scenario.owner !== "pro");
}

export function findSeedPurgeScenario(
  key: SeedPurgeDemoScenarioKey,
): SeedPurgeDemoScenarioDefinition {
  const scenario = SEED_PURGE_DEMO_SCENARIOS.find((item) => item.key === key);
  if (scenario == null) {
    throw new Error(`Unknown purge seed scenario: ${key}`);
  }
  return scenario;
}
