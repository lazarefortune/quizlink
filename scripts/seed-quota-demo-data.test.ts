import { describe, expect, it, vi } from "vitest";

import {
  addDays,
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
} from "../lib/seed/seedQuotaDemoData";

const now = new Date("2026-05-27T12:00:00.000Z");

describe("parseSeedQuotaDemoOptions", () => {
  it("requires ownerEmail", () => {
    expect(() => parseSeedQuotaDemoOptions([])).toThrow(/--ownerEmail est obligatoire/);
  });

  it("parses reset and verbose flags", () => {
    expect(
      parseSeedQuotaDemoOptions([
        "--ownerEmail=test@example.com",
        "--reset",
        "--verbose",
      ]),
    ).toEqual({
      ownerEmail: "test@example.com",
      reset: true,
      withProOwner: true,
      verbose: true,
    });
  });

  it("allows skipping pro owner scenario", () => {
    expect(
      parseSeedQuotaDemoOptions(["--ownerEmail=test@example.com", "--skipProOwner"]),
    ).toEqual({
      ownerEmail: "test@example.com",
      reset: false,
      withProOwner: false,
      verbose: false,
    });
  });
});

describe("seed quota demo helpers", () => {
  it("builds prefixed quiz titles", () => {
    expect(buildSeedQuizTitle("12/20 — Gratuit en cours")).toBe(
      `${SEED_QUOTA_DEMO_TITLE_PREFIX} 12/20 — Gratuit en cours`,
    );
    expect(isSeedQuotaDemoQuizTitle(`${SEED_QUOTA_DEMO_TITLE_PREFIX} 12/20`)).toBe(true);
    expect(isSeedQuotaDemoQuizTitle("Mon quiz")).toBe(false);
  });

  it("derives pro owner email from normal owner email", () => {
    expect(deriveProOwnerEmail("lazare@test.com")).toBe("pro-lazare@test.com");
  });

  it("defines all expected quota scenarios", () => {
    const keys = SEED_QUOTA_DEMO_SCENARIOS.map((scenario) => scenario.key);
    expect(keys).toEqual([
      "FREE_EMPTY",
      "FREE_IN_PROGRESS",
      "FREE_LIMIT_REACHED",
      "LEGACY_OVER_LIMIT",
      "COINS_UNLOCKED",
      "PRO_ACTIVE",
      "PRO_EXPIRED",
      "DETAILS_PURGED",
    ]);
  });

  it("builds not-started link dates for empty free quiz", () => {
    const scenario = SEED_QUOTA_DEMO_SCENARIOS.find((item) => item.key === "FREE_EMPTY")!;
    const dates = buildSeedLinkDates(now, scenario);

    expect(dates.responsesStartedAt).toBeNull();
    expect(dates.detailsPurgedAt).toBeNull();
  });

  it("builds started link dates for in-progress quiz", () => {
    const scenario = SEED_QUOTA_DEMO_SCENARIOS.find(
      (item) => item.key === "FREE_IN_PROGRESS",
    )!;
    const dates = buildSeedLinkDates(now, scenario);

    expect(dates.responsesStartedAt).not.toBeNull();
    expect(dates.responsesStartedAt!.getTime()).toBeLessThan(now.getTime());
  });

  it("builds attempt specs with abandoned attempts excluded from completed count", () => {
    const scenario = SEED_QUOTA_DEMO_SCENARIOS.find(
      (item) => item.key === "FREE_IN_PROGRESS",
    )!;
    const specs = buildAttemptSpecsForQuota(scenario);

    expect(specs.filter((spec) => spec.status === "COMPLETED")).toHaveLength(12);
    expect(specs.filter((spec) => spec.status === "ABANDONED")).toHaveLength(3);
  });

  it("marks coins-unlocked scenario with permanent unlock flag", () => {
    const scenario = SEED_QUOTA_DEMO_SCENARIOS.find(
      (item) => item.key === "COINS_UNLOCKED",
    )!;
    expect(scenario.withCoinUnlock).toBe(true);
  });

  it("marks pro expired scenario on normal owner", () => {
    const scenario = SEED_QUOTA_DEMO_SCENARIOS.find(
      (item) => item.key === "PRO_EXPIRED",
    )!;
    expect(scenario.withExpiredSubscriptionOnOwner).toBe(true);
    expect(scenario.owner).toBe("normal");
  });

  it("generates deterministic unique link tokens", () => {
    const tokenA = generateSeedLinkToken("owner:FREE_IN_PROGRESS");
    const tokenB = generateSeedLinkToken("owner:FREE_LIMIT_REACHED");

    expect(tokenA).toHaveLength(12);
    expect(tokenB).toHaveLength(12);
    expect(tokenA).not.toBe(tokenB);
  });

  it("builds link tokens from quiz id for run isolation", () => {
    expect(buildSeedLinkTokenForQuiz("quiz-a")).not.toBe(
      buildSeedLinkTokenForQuiz("quiz-b"),
    );
  });

  it("excludes pro active scenario when withProOwner is false", () => {
    const scenarios = resolveSeedScenarios(false);
    expect(scenarios.some((scenario) => scenario.key === "PRO_ACTIVE")).toBe(false);
    expect(scenarios).toHaveLength(7);
  });

  it("addDays shifts calendar dates", () => {
    expect(addDays(now, 7).toISOString()).toBe("2026-06-03T12:00:00.000Z");
  });
});

describe("isSeedQuotaDemoQuizTitle reset safety", () => {
  it("only matches prefixed seed titles", () => {
    expect(
      isSeedQuotaDemoQuizTitle(`${SEED_QUOTA_DEMO_TITLE_PREFIX} 12/20 — Gratuit en cours`),
    ).toBe(true);
    expect(isSeedQuotaDemoQuizTitle("[SEED QUOTA DEMO]")).toBe(true);
    expect(isSeedQuotaDemoQuizTitle("Quiz marketing Q2")).toBe(false);
  });
});

describe("assertSeedQuotaDemoEnvironmentAllowed", () => {
  it("blocks production without explicit env flag", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_QUOTA_DEMO_SEED", undefined);

    const { assertSeedQuotaDemoEnvironmentAllowed } = await import(
      "../lib/seed/seedQuotaDemoData"
    );

    expect(() => assertSeedQuotaDemoEnvironmentAllowed()).toThrow(
      /ALLOW_QUOTA_DEMO_SEED=1/,
    );

    vi.unstubAllEnvs();
  });
});

describe("loadScriptEnv integration", () => {
  it("can be invoked without throwing", async () => {
    const { loadScriptEnv, resetScriptEnvForTests } = await import("../lib/env/loadScriptEnv");
    resetScriptEnvForTests();
    expect(() => loadScriptEnv()).not.toThrow();
  });
});
