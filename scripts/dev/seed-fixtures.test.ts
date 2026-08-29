/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    coinPack: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async () => "hashed-password"),
  },
}));

import { prisma } from "../../lib/prisma";
import {
  assertDevFixturesAllowed,
  assertSafeDevDatabaseUrl,
  ensureDefaultCoinPacks,
  isPlaceholderDevAdminPassword,
  resolveDevAdminFixtureInput,
  upsertDevAdminUser,
} from "./seed-fixtures";

describe("seed-fixtures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects placeholder passwords", () => {
    expect(isPlaceholderDevAdminPassword("change-me")).toBe(true);
    expect(isPlaceholderDevAdminPassword("quizlink-dev-admin")).toBe(true);
    expect(isPlaceholderDevAdminPassword("a-strong-local-secret-99")).toBe(false);
  });

  it("requires a real DEV_ADMIN_PASSWORD from env", () => {
    expect(() => resolveDevAdminFixtureInput({})).toThrow(/DEV_ADMIN_PASSWORD/i);
    expect(() =>
      resolveDevAdminFixtureInput({ DEV_ADMIN_PASSWORD: "change-me" }),
    ).toThrow(/placeholder/i);

    expect(
      resolveDevAdminFixtureInput({
        DEV_ADMIN_PASSWORD: "a-strong-local-secret-99",
      }),
    ).toEqual({
      email: "admin@quizlink.local",
      password: "a-strong-local-secret-99",
      name: "QuizLink Dev Admin",
    });
  });

  it("blocks fixtures in production with no override", () => {
    expect(() =>
      assertDevFixturesAllowed({
        NODE_ENV: "production",
        ALLOW_DEV_FIXTURES: "1",
        DATABASE_URL: "mysql://quizlink:quizlink@db:3306/quizlink",
      }),
    ).toThrow(/NODE_ENV=production/i);
  });

  it("requires ALLOW_DEV_FIXTURES=1 and a safe DB host", () => {
    expect(() =>
      assertDevFixturesAllowed({
        NODE_ENV: "development",
        DATABASE_URL: "mysql://quizlink:quizlink@db:3306/quizlink",
      }),
    ).toThrow(/ALLOW_DEV_FIXTURES=1/i);

    expect(() =>
      assertSafeDevDatabaseUrl("mysql://user:pass@prod.example.com:3306/quizlink"),
    ).toThrow(/unexpected database host/i);

    expect(() =>
      assertDevFixturesAllowed({
        NODE_ENV: "development",
        ALLOW_DEV_FIXTURES: "1",
        DATABASE_URL: "mysql://quizlink:quizlink@db:3306/quizlink",
      }),
    ).not.toThrow();
  });

  it("creates admin once then updates on second call without duplicating", async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "user_1", role: "USER" });
    vi.mocked(prisma.user.create).mockResolvedValueOnce({} as never);
    vi.mocked(prisma.user.update).mockResolvedValueOnce({} as never);

    const input = {
      email: "admin@quizlink.local",
      password: "a-strong-local-secret-99",
      name: "QuizLink Dev Admin",
    };
    const first = await upsertDevAdminUser(input);
    const second = await upsertDevAdminUser(input);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    expect(prisma.user.update).toHaveBeenCalledTimes(1);
  });

  it("skips existing coin packs", async () => {
    vi.mocked(prisma.coinPack.findUnique).mockResolvedValue({ id: "pack_1" } as never);

    const result = await ensureDefaultCoinPacks();

    expect(result.created).toBe(0);
    expect(result.skipped).toBe(3);
    expect(prisma.coinPack.create).not.toHaveBeenCalled();
  });
});
