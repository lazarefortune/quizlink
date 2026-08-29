/**
 * DEV-only fixtures: first admin + default coin packs.
 * Idempotent upserts — safe to run repeatedly (`make fixtures`).
 */

import bcrypt from "bcryptjs";

import { loadScriptEnv } from "../../lib/env/loadScriptEnv";
import { prisma } from "../../lib/prisma";

export const DEFAULT_DEV_ADMIN_EMAIL = "admin@quizlink.local";
export const DEFAULT_DEV_ADMIN_NAME = "QuizLink Dev Admin";

/** Placeholder values that must never be used as a real DEV admin password. */
export const DEV_ADMIN_PASSWORD_PLACEHOLDERS = [
  "change-me",
  "changeme",
  "replace-me",
  "quizlink-dev-admin",
  "password",
  "password123",
] as const;

const DEFAULT_COIN_PACKS = [
  {
    name: "STARTER",
    displayName: "Pack Starter",
    coins: 50,
    price: 500,
    stripePriceId: null as string | null,
    isActive: true,
    isPopular: false,
    order: 0,
  },
  {
    name: "BOOST",
    displayName: "Pack Boost",
    coins: 120,
    price: 1000,
    stripePriceId: null as string | null,
    isActive: true,
    isPopular: true,
    order: 1,
  },
  {
    name: "PRO",
    displayName: "Pack Pro",
    coins: 300,
    price: 2000,
    stripePriceId: null as string | null,
    isActive: true,
    isPopular: false,
    order: 2,
  },
] as const;

export type DevAdminFixtureInput = {
  email: string;
  password: string;
  name: string;
};

export function isPlaceholderDevAdminPassword(password: string): boolean {
  const normalized = password.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  if (
    DEV_ADMIN_PASSWORD_PLACEHOLDERS.includes(
      normalized as (typeof DEV_ADMIN_PASSWORD_PLACEHOLDERS)[number],
    )
  ) {
    return true;
  }
  return (
    normalized.startsWith("change-me") ||
    normalized.startsWith("replace-me") ||
    normalized.includes("change-me")
  );
}

export function resolveDevAdminFixtureInput(
  env: NodeJS.ProcessEnv = process.env,
): DevAdminFixtureInput {
  const password = env.DEV_ADMIN_PASSWORD?.trim() ?? "";
  if (!password || isPlaceholderDevAdminPassword(password)) {
    throw new Error(
      "DEV_ADMIN_PASSWORD is missing or still a placeholder. Run `make install` (generates a local password into .env.docker) or set a strong value there.",
    );
  }

  return {
    email: (env.DEV_ADMIN_EMAIL?.trim() || DEFAULT_DEV_ADMIN_EMAIL).toLowerCase(),
    password,
    name: env.DEV_ADMIN_NAME?.trim() || DEFAULT_DEV_ADMIN_NAME,
  };
}

/**
 * Multiple hard stops so fixtures cannot run against production by accident.
 * There is intentionally no production override.
 */
export function assertDevFixturesAllowed(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV === "production") {
    throw new Error(
      "Dev fixtures are forbidden when NODE_ENV=production.",
    );
  }

  if (env.ALLOW_DEV_FIXTURES !== "1") {
    throw new Error(
      "Dev fixtures require ALLOW_DEV_FIXTURES=1 (set automatically by `make fixtures`).",
    );
  }

  assertSafeDevDatabaseUrl(env.DATABASE_URL);
}

export function assertSafeDevDatabaseUrl(databaseUrl: string | undefined): void {
  if (!databaseUrl?.trim()) {
    throw new Error("DATABASE_URL is required for fixtures.");
  }

  let hostname: string;
  try {
    hostname = new URL(databaseUrl.replace(/^mysql:\/\//i, "http://")).hostname;
  } catch {
    throw new Error("DATABASE_URL is invalid; refusing to run fixtures.");
  }

  const allowedHosts = new Set(["db", "localhost", "127.0.0.1"]);
  if (!allowedHosts.has(hostname)) {
    throw new Error(
      `Refusing fixtures against unexpected database host "${hostname}". Expected db, localhost, or 127.0.0.1 for DEV.`,
    );
  }
}

export async function upsertDevAdminUser(
  input: DevAdminFixtureInput,
): Promise<{ email: string; created: boolean; role: string }> {
  if (isPlaceholderDevAdminPassword(input.password)) {
    throw new Error("Refusing to hash a placeholder DEV_ADMIN_PASSWORD.");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, role: true },
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        role: "ADMIN",
        emailVerifiedAt: new Date(),
        coinBalance: 500,
        preferredLanguage: "fr",
      },
    });
    return { email: input.email, created: true, role: "ADMIN" };
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: {
      name: input.name,
      passwordHash,
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    },
  });

  return { email: input.email, created: false, role: "ADMIN" };
}

export async function ensureDefaultCoinPacks(): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const pack of DEFAULT_COIN_PACKS) {
    const existing = await prisma.coinPack.findUnique({
      where: { name: pack.name },
      select: { id: true },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.coinPack.create({ data: { ...pack } });
    created += 1;
  }

  return { created, skipped };
}

async function main(): Promise<void> {
  loadScriptEnv();
  assertDevFixturesAllowed();

  const resetAdmin = process.argv.includes("--reset-admin");
  const adminInput = resolveDevAdminFixtureInput();

  if (resetAdmin) {
    const deleted = await prisma.user.deleteMany({ where: { email: adminInput.email } });
    console.log(`[fixtures] Removed DEV admin rows: ${deleted.count} (${adminInput.email})`);
  }

  const admin = await upsertDevAdminUser(adminInput);
  const packs = await ensureDefaultCoinPacks();

  console.log("[fixtures] Dev admin:", admin.created ? "created" : "updated", admin.email);
  console.log(`[fixtures] Coin packs: created=${packs.created} skipped=${packs.skipped}`);
  console.log("[fixtures] Sign in with DEV_ADMIN_EMAIL / DEV_ADMIN_PASSWORD from .env.docker");
}

const entryPath = process.argv[1] ?? "";
const isDirectRun = /(^|[/\\])seed-fixtures\.(ts|js|mts|cts)$/.test(entryPath);

if (isDirectRun) {
  main()
    .catch((error: unknown) => {
      console.error("[fixtures] Failed:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
