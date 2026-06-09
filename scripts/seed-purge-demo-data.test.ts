import { describe, expect, it } from "vitest";

import {
  addDays,
  buildSeedCampaignDates,
  buildSeedLinkTokenForQuiz,
  buildSeedQuizTitle,
  deriveProOwnerEmail,
  generateSeedLinkToken,
  isSeedPurgeDemoQuizTitle,
  parseSeedPurgeDemoOptions,
  resolveSeedScenarios,
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
    expect(buildSeedQuizTitle("Purgeable")).toBe(
      `${SEED_PURGE_DEMO_TITLE_PREFIX} Purgeable`,
    );
    expect(isSeedPurgeDemoQuizTitle(`${SEED_PURGE_DEMO_TITLE_PREFIX} Purgeable`)).toBe(
      true,
    );
    expect(isSeedPurgeDemoQuizTitle("Mon quiz")).toBe(false);
  });

  it("derives pro owner email from normal owner email", () => {
    expect(deriveProOwnerEmail("lazare@test.com")).toBe("pro-lazare@test.com");
  });

  it("computes relative campaign dates for purgeable quiz", () => {
    const dates = buildSeedCampaignDates(now, "PURGEABLE");

    expect(dates.detailsPurgedAt).toBeNull();
    expect(dates.unlockedUntil).toBeNull();
    expect(dates.acceptingResponsesUntil.getTime()).toBeLessThan(now.getTime());

    const daysSinceExpiry = Math.floor(
      (now.getTime() - dates.acceptingResponsesUntil.getTime()) / (24 * 60 * 60 * 1000),
    );
    expect(daysSinceExpiry).toBe(38);
  });

  it("computes grace-active quiz as expired but not purgeable yet", () => {
    const dates = buildSeedCampaignDates(now, "GRACE_ACTIVE");
    expect(dates.acceptingResponsesUntil.getTime()).toBeLessThan(now.getTime());

    const daysSinceExpiry = Math.floor(
      (now.getTime() - dates.acceptingResponsesUntil.getTime()) / (24 * 60 * 60 * 1000),
    );
    expect(daysSinceExpiry).toBe(3);
    expect(dates.detailsPurgedAt).toBeNull();
  });

  it("marks already purged quiz with detailsPurgedAt", () => {
    const dates = buildSeedCampaignDates(now, "ALREADY_PURGED");
    expect(dates.detailsPurgedAt).not.toBeNull();
    expect(dates.detailsPurgedAt!.getTime()).toBeLessThan(now.getTime());
  });

  it("extends coins-unlocked quiz into the future", () => {
    const dates = buildSeedCampaignDates(now, "COINS_UNLOCKED");
    expect(dates.unlockedUntil!.getTime()).toBeGreaterThan(now.getTime());
    expect(dates.acceptingResponsesUntil.getTime()).toBe(dates.unlockedUntil!.getTime());
  });

  it("generates deterministic unique link tokens", () => {
    const tokenA = generateSeedLinkToken("owner:FREE_ACTIVE");
    const tokenB = generateSeedLinkToken("owner:PURGEABLE");

    expect(tokenA).toHaveLength(12);
    expect(tokenB).toHaveLength(12);
    expect(tokenA).not.toBe(tokenB);
    expect(generateSeedLinkToken("owner:FREE_ACTIVE")).toBe(tokenA);
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
    expect(isSeedPurgeDemoQuizTitle(`${SEED_PURGE_DEMO_TITLE_PREFIX} Gratuit actif`)).toBe(
      true,
    );
    expect(isSeedPurgeDemoQuizTitle("[SEED PURGE DEMO]")).toBe(true);
    expect(isSeedPurgeDemoQuizTitle("Quiz marketing Q2")).toBe(false);
  });
});
