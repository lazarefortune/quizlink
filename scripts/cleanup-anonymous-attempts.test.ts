import { describe, expect, it } from "vitest";

import {
  formatStatusBreakdownLine,
  parseCleanupAnonymousAttemptsArgs,
  rollupAnonymousAttemptsPerQuizLink,
  type AnonymousAttemptLite,
} from "./cleanup-anonymous-attempts";

describe("parseCleanupAnonymousAttemptsArgs", () => {
  it("refuses execution without flags", () => {
    const result = parseCleanupAnonymousAttemptsArgs([]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("--dry-run");
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

  it("prefers dry-run when both flags are present", () => {
    const result = parseCleanupAnonymousAttemptsArgs(["--confirm", "--dry-run"]);
    expect(result).toEqual({ ok: true, mode: "dry-run" });
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
