import { describe, expect, it } from "vitest";

import {
  addDays,
  buildAttemptSpecsForPurgeScenario,
  buildSeedLinkDates,
  buildSeedLastResponseAt,
  buildSeedLinkTokenForQuiz,
  buildSeedQuizTitle,
  deriveProOwnerEmail,
  findSeedPurgeScenario,
  generateSeedLinkToken,
  isSeedPurgeDemoQuizTitle,
  parseSeedPurgeDemoOptions,
  resolveSeedScenarios,
  SEED_PURGE_DEMO_SCENARIOS,
  SEED_PURGE_DEMO_TITLE_PREFIX,
} from "../lib/seed/seedPurgeDemoData";

const now = new Date("2026-05-27T12:00:00.000Z");

describe("parseSeedPurgeDemoOptions", () => {
  it("requires ownerEmail", () => {
    expect(() => parseSeedPurgeDemoOptions([])).toThrow(/--ownerEmail est obligatoire/);
  });

  it("parses reset and verbose flags", () => {
    expect(
      parseSeedPurgeDemoOptions([
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
      parseSeedPurgeDemoOptions(["--ownerEmail=test@example.com", "--skipProOwner"]),
    ).toEqual({
      ownerEmail: "test@example.com",
      reset: false,
      withProOwner: false,
      verbose: false,
    });
  });
});

describe("seed purge demo helpers", () => {
  it("builds prefixed quiz titles", () => {
    expect(buildSeedQuizTitle("Quota purgeable")).toBe(
      `${SEED_PURGE_DEMO_TITLE_PREFIX} Quota purgeable`,
    );
    expect(isSeedPurgeDemoQuizTitle(`${SEED_PURGE_DEMO_TITLE_PREFIX} Quota purgeable`)).toBe(
      true,
    );
    expect(isSeedPurgeDemoQuizTitle("Mon quiz")).toBe(false);
  });

  it("derives pro owner email from normal owner email", () => {
    expect(deriveProOwnerEmail("lazare@test.com")).toBe("pro-lazare@test.com");
  });

  it("defines quota purge scenarios", () => {
    const keys = SEED_PURGE_DEMO_SCENARIOS.map((scenario) => scenario.key);
    expect(keys).toEqual([
      "QUOTA_NOT_REACHED",
      "QUOTA_GRACE_ACTIVE",
      "QUOTA_PURGEABLE",
      "ALREADY_PURGED",
      "COINS_UNLOCKED",
      "PRO_OWNER",
    ]);
  });

  it("builds lastResponseAt from age in days", () => {
    const purgeable = findSeedPurgeScenario("QUOTA_PURGEABLE");
    const lastResponseAt = buildSeedLastResponseAt(now, purgeable.lastResponseAgeDays);
    expect(lastResponseAt.getTime()).toBe(addDays(now, -45).getTime());
  });

  it("builds link dates for purge seeds", () => {
    const dates = buildSeedLinkDates(now);
    expect(dates.detailsPurgedAt).toBeNull();
    expect(dates.responsesStartedAt.getTime()).toBeLessThan(now.getTime());
  });

  it("builds 20 completed attempts for purgeable scenario", () => {
    const scenario = findSeedPurgeScenario("QUOTA_PURGEABLE");
    const specs = buildAttemptSpecsForPurgeScenario(scenario);
    expect(specs.filter((spec) => spec.status === "COMPLETED")).toHaveLength(20);
  });

  it("builds 12 completed attempts for not reached scenario", () => {
    const scenario = findSeedPurgeScenario("QUOTA_NOT_REACHED");
    const specs = buildAttemptSpecsForPurgeScenario(scenario);
    expect(specs.filter((spec) => spec.status === "COMPLETED")).toHaveLength(12);
  });

  it("marks coins-unlocked scenario with permanent unlock flag", () => {
    const scenario = findSeedPurgeScenario("COINS_UNLOCKED");
    expect(scenario.withCoinUnlock).toBe(true);
    expect(scenario.targetCompletedCount).toBe(25);
  });

  it("generates deterministic unique link tokens", () => {
    const tokenA = generateSeedLinkToken("owner:QUOTA_PURGEABLE");
    const tokenB = generateSeedLinkToken("owner:QUOTA_NOT_REACHED");

    expect(tokenA).toHaveLength(12);
    expect(tokenB).toHaveLength(12);
    expect(tokenA).not.toBe(tokenB);
  });

  it("builds link tokens from quiz id for run isolation", () => {
    expect(buildSeedLinkTokenForQuiz("quiz-a")).not.toBe(
      buildSeedLinkTokenForQuiz("quiz-b"),
    );
  });

  it("excludes pro scenario when withProOwner is false", () => {
    const scenarios = resolveSeedScenarios(false);
    expect(scenarios.some((scenario) => scenario.key === "PRO_OWNER")).toBe(false);
    expect(scenarios).toHaveLength(5);
  });

  it("addDays shifts calendar dates", () => {
    expect(addDays(now, 7).toISOString()).toBe("2026-06-03T12:00:00.000Z");
  });
});

describe("isSeedPurgeDemoQuizTitle reset safety", () => {
  it("only matches prefixed seed titles", () => {
    expect(
      isSeedPurgeDemoQuizTitle(`${SEED_PURGE_DEMO_TITLE_PREFIX} Quota purgeable`),
    ).toBe(true);
    expect(isSeedPurgeDemoQuizTitle("[SEED PURGE DEMO]")).toBe(true);
    expect(isSeedPurgeDemoQuizTitle("Quiz marketing Q2")).toBe(false);
  });
});
