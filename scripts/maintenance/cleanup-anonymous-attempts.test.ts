import { describe, expect, it } from "vitest";

import {
  aggregatesFromQuizLinkStatusCounts,
  formatStatusBreakdownLine,
  parseCleanupAnonymousAttemptsArgs,
  rollupAnonymousAttemptsPerQuizLink,
  validateAnonymousStatsBeforeCleanup,
  type AnonymousAttemptLite,
  type QuizLinkStatusCountRow,
} from "./cleanup-anonymous-attempts";

describe("parseCleanupAnonymousAttemptsArgs", () => {
  it("refuses execution without flags", () => {
    const result = parseCleanupAnonymousAttemptsArgs([]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("--dry-run");
      expect(result.message).toContain("--confirm-delete");
    }
  });

  it("accepts --dry-run", () => {
    const result = parseCleanupAnonymousAttemptsArgs(["--dry-run"]);
    expect(result).toEqual({ ok: true, mode: "dry-run" });
  });

  it("accepts --confirm", () => {
    const result = parseCleanupAnonymousAttemptsArgs(["--confirm"]);
    expect(result).toEqual({ ok: true, mode: "confirm" });
  });

  it("accepts --confirm-delete", () => {
    const result = parseCleanupAnonymousAttemptsArgs(["--confirm-delete"]);
    expect(result).toEqual({ ok: true, mode: "confirm-delete" });
  });

  it("prefers dry-run when combined with --confirm", () => {
    const result = parseCleanupAnonymousAttemptsArgs(["--confirm", "--dry-run"]);
    expect(result).toEqual({ ok: true, mode: "dry-run" });
  });

  it("prefers dry-run when combined with --confirm-delete", () => {
    const result = parseCleanupAnonymousAttemptsArgs([
      "--confirm-delete",
      "--dry-run",
    ]);
    expect(result).toEqual({ ok: true, mode: "dry-run" });
  });

  it("refuses --confirm together with --confirm-delete without dry-run", () => {
    const result = parseCleanupAnonymousAttemptsArgs([
      "--confirm",
      "--confirm-delete",
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("Ne combinez pas");
    }
  });
});

describe("aggregatesFromQuizLinkStatusCounts", () => {
  it("builds per-link totals and completed counts", () => {
    const rows: QuizLinkStatusCountRow[] = [
      { quizLinkId: "L1", status: "COMPLETED", count: 2 },
      { quizLinkId: "L1", status: "IN_PROGRESS", count: 1 },
      { quizLinkId: "L2", status: "ABANDONED", count: 3 },
    ];

    const map = aggregatesFromQuizLinkStatusCounts(rows);

    expect(map.get("L1")).toEqual({
      anonymousAttempts: 3,
      completedAttempts: 2,
    });
    expect(map.get("L2")).toEqual({
      anonymousAttempts: 3,
      completedAttempts: 0,
    });
  });
});

describe("validateAnonymousStatsBeforeCleanup", () => {
  it("passes when every link has stats and counts are coherent", () => {
    const aggregates = new Map([
      ["a", { anonymousAttempts: 5, completedAttempts: 2 }],
      ["b", { anonymousAttempts: 1, completedAttempts: 1 }],
    ]);
    const stats = new Map([
      ["a", { startedCount: 5, completedCount: 2 }],
      ["b", { startedCount: 10, completedCount: 3 }],
    ]);

    expect(validateAnonymousStatsBeforeCleanup(aggregates, stats)).toEqual({
      ok: true,
    });
  });

  it("fails when stats row is missing", () => {
    const aggregates = new Map([
      ["x", { anonymousAttempts: 1, completedAttempts: 0 }],
    ]);
    const stats = new Map<string, { startedCount: number; completedCount: number }>();

    const result = validateAnonymousStatsBeforeCleanup(aggregates, stats);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0].quizLinkId).toBe("x");
      expect(result.failures[0].reason).toContain("absente");
    }
  });

  it("fails when startedCount is too low", () => {
    const aggregates = new Map([
      ["x", { anonymousAttempts: 4, completedAttempts: 1 }],
    ]);
    const stats = new Map([
      ["x", { startedCount: 3, completedCount: 2 }],
    ]);

    const result = validateAnonymousStatsBeforeCleanup(aggregates, stats);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failures[0].reason).toContain("startedCount");
    }
  });

  it("fails when completedCount is too low", () => {
    const aggregates = new Map([
      ["x", { anonymousAttempts: 2, completedAttempts: 3 }],
    ]);
    const stats = new Map([
      ["x", { startedCount: 10, completedCount: 2 }],
    ]);

    const result = validateAnonymousStatsBeforeCleanup(aggregates, stats);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failures[0].reason).toContain("completedCount");
    }
  });

  it("accepts empty aggregates", () => {
    expect(
      validateAnonymousStatsBeforeCleanup(new Map(), new Map()),
    ).toEqual({ ok: true });
  });
});

describe("rollupAnonymousAttemptsPerQuizLink", () => {
  it("aggregates attempts, answers, and status buckets per quiz link", () => {
    const rows: AnonymousAttemptLite[] = [
      { quizLinkId: "a", status: "COMPLETED", answerCount: 3 },
      { quizLinkId: "a", status: "IN_PROGRESS", answerCount: 1 },
      { quizLinkId: "a", status: "ABANDONED", answerCount: 0 },
      { quizLinkId: "b", status: "COMPLETED", answerCount: 5 },
      { quizLinkId: "b", status: "WEIRD", answerCount: 2 },
    ];

    const map = rollupAnonymousAttemptsPerQuizLink(rows);

    expect(map.get("a")).toEqual({
      anonymousAttempts: 3,
      linkedAnswers: 4,
      completedAttempts: 1,
      inProgressAttempts: 1,
      abandonedAttempts: 1,
      otherStatusAttempts: 0,
    });

    expect(map.get("b")).toEqual({
      anonymousAttempts: 2,
      linkedAnswers: 7,
      completedAttempts: 1,
      inProgressAttempts: 0,
      abandonedAttempts: 0,
      otherStatusAttempts: 1,
    });
  });

  it("returns an empty map for an empty list", () => {
    expect(rollupAnonymousAttemptsPerQuizLink([]).size).toBe(0);
  });
});

describe("formatStatusBreakdownLine", () => {
  it("formats count and percentage when total is positive", () => {
    expect(formatStatusBreakdownLine("COMPLETED", 3, 10)).toBe(
      "  COMPLETED: 3 (30.0%)",
    );
  });

  it("avoids division by zero", () => {
    expect(formatStatusBreakdownLine("IN_PROGRESS", 0, 0)).toBe(
      "  IN_PROGRESS: 0",
    );
  });
});
