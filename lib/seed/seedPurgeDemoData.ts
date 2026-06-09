import crypto from "node:crypto";

export const SEED_PURGE_DEMO_TITLE_PREFIX = "[SEED PURGE DEMO]";

export type SeedPurgeDemoScenarioKey =
  | "FREE_ACTIVE"
  | "GRACE_ACTIVE"
  | "PURGEABLE"
  | "ALREADY_PURGED"
  | "COINS_UNLOCKED"
  | "PRO_OWNER";

export type SeedPurgeDemoOptions = {
  ownerEmail: string;
  reset: boolean;
  withProOwner: boolean;
  verbose: boolean;
};

export type SeedCampaignDates = {
  responsesStartedAt: Date;
  acceptingResponsesUntil: Date;
  detailsVisibleUntil: Date;
  detailsPurgedAt: Date | null;
  unlockedUntil: Date | null;
};

export type SeedPurgeDemoScenarioDefinition = {
  key: SeedPurgeDemoScenarioKey;
  titleSuffix: string;
  owner: "normal" | "pro";
};

export const SEED_PURGE_DEMO_SCENARIOS: readonly SeedPurgeDemoScenarioDefinition[] = [
  { key: "FREE_ACTIVE", titleSuffix: "Gratuit actif", owner: "normal" },
  { key: "GRACE_ACTIVE", titleSuffix: "Grâce active", owner: "normal" },
  { key: "PURGEABLE", titleSuffix: "Purgeable", owner: "normal" },
  { key: "ALREADY_PURGED", titleSuffix: "Déjà purgé", owner: "normal" },
  { key: "COINS_UNLOCKED", titleSuffix: "Débloqué coins", owner: "normal" },
  { key: "PRO_OWNER", titleSuffix: "Owner Pro", owner: "pro" },
] as const;

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

export function buildSeedCampaignDates(
  now: Date,
  scenario: SeedPurgeDemoScenarioKey,
): SeedCampaignDates {
  switch (scenario) {
    case "FREE_ACTIVE": {
      const responsesStartedAt = addDays(now, -2);
      const acceptingResponsesUntil = addDays(responsesStartedAt, 7);
      return {
        responsesStartedAt,
        acceptingResponsesUntil,
        detailsVisibleUntil: acceptingResponsesUntil,
        detailsPurgedAt: null,
        unlockedUntil: null,
      };
    }
    case "GRACE_ACTIVE": {
      const responsesStartedAt = addDays(now, -10);
      const acceptingResponsesUntil = addDays(responsesStartedAt, 7);
      return {
        responsesStartedAt,
        acceptingResponsesUntil,
        detailsVisibleUntil: acceptingResponsesUntil,
        detailsPurgedAt: null,
        unlockedUntil: null,
      };
    }
    case "PURGEABLE": {
      const responsesStartedAt = addDays(now, -45);
      const acceptingResponsesUntil = addDays(responsesStartedAt, 7);
      return {
        responsesStartedAt,
        acceptingResponsesUntil,
        detailsVisibleUntil: acceptingResponsesUntil,
        detailsPurgedAt: null,
        unlockedUntil: null,
      };
    }
    case "ALREADY_PURGED": {
      const responsesStartedAt = addDays(now, -60);
      const acceptingResponsesUntil = addDays(responsesStartedAt, 7);
      return {
        responsesStartedAt,
        acceptingResponsesUntil,
        detailsVisibleUntil: acceptingResponsesUntil,
        detailsPurgedAt: addDays(now, -1),
        unlockedUntil: null,
      };
    }
    case "COINS_UNLOCKED": {
      const responsesStartedAt = addDays(now, -45);
      const unlockedUntil = addDays(now, 30);
      return {
        responsesStartedAt,
        acceptingResponsesUntil: unlockedUntil,
        detailsVisibleUntil: unlockedUntil,
        detailsPurgedAt: null,
        unlockedUntil,
      };
    }
    case "PRO_OWNER": {
      const responsesStartedAt = addDays(now, -60);
      const acceptingResponsesUntil = addDays(responsesStartedAt, 7);
      return {
        responsesStartedAt,
        acceptingResponsesUntil,
        detailsVisibleUntil: acceptingResponsesUntil,
        detailsPurgedAt: null,
        unlockedUntil: null,
      };
    }
    default: {
      const exhaustive: never = scenario;
      return exhaustive;
    }
  }
}

export function generateSeedLinkToken(seedKey: string): string {
  const hash = crypto.createHash("sha256").update(seedKey).digest("base64url");
  return hash.slice(0, 12);
}

/** Token scoped to a quiz row — unique across seed runs (unlike owner+scenario). */
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
