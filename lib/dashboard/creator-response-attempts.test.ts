import { describe, expect, it } from "vitest";

import {
  buildAnonymousAttemptIndexMap,
  buildLockedPlaceholderRowKeys,
  computeCreatorResponseStats,
  computeLockedAttemptCount,
  formatAnonymousParticipantLabel,
  mapAttemptsToDetailRows,
  resolveAttemptDetailsPurged,
  resolveAttemptDurationSeconds,
  type CreatorResponseAttemptRecord,
} from "./creator-response-attempts";

const baseDate = new Date("2026-05-20T10:00:00Z");

function makeAttempt(
  overrides: Partial<CreatorResponseAttemptRecord> = {},
): CreatorResponseAttemptRecord {
  return {
    id: "a1",
    participantId: null,
    identityMode: "ANONYMOUS",
    participantName: null,
    participantEmail: null,
    score: 80,
    status: "COMPLETED",
    startedAt: baseDate,
    finishedAt: new Date("2026-05-20T10:05:00Z"),
    durationSeconds: 300,
    participant: null,
    questionsAnswered: 1,
    totalQuestions: 5,
    quizLinkDetailsPurgedAt: null,
    ...overrides,
  };
}

describe("creator-response-attempts", () => {
  it("computeLockedAttemptCount returns total minus visible when not unlocked", () => {
    expect(computeLockedAttemptCount(10, 3, false)).toBe(7);
    expect(computeLockedAttemptCount(2, 2, false)).toBe(0);
    expect(computeLockedAttemptCount(10, 3, true)).toBe(0);
  });

  it("buildLockedPlaceholderRowKeys generates synthetic ids only", () => {
    const keys = buildLockedPlaceholderRowKeys(12, 5);
    expect(keys).toHaveLength(5);
    expect(keys.every((key) => key.startsWith("locked-placeholder-"))).toBe(true);
  });

  it("numbers anonymous participants from oldest attempt", () => {
    const map = buildAnonymousAttemptIndexMap([
      { id: "new", startedAt: new Date("2026-05-22T10:00:00Z") },
      { id: "old", startedAt: new Date("2026-05-20T10:00:00Z") },
    ]);
    expect(map.get("old")).toBe(1);
    expect(map.get("new")).toBe(2);
    expect(formatAnonymousParticipantLabel(2)).toBe("Participant anonyme #2");
  });

  it("computes average score and duration from completed attempts", () => {
    const stats = computeCreatorResponseStats([
      makeAttempt({ id: "a1", score: 80, durationSeconds: 100 }),
      makeAttempt({
        id: "a2",
        score: 60,
        durationSeconds: null,
        finishedAt: new Date("2026-05-20T10:02:00Z"),
        startedAt: new Date("2026-05-20T10:00:00Z"),
      }),
      makeAttempt({ id: "a3", status: "IN_PROGRESS", score: null }),
    ]);

    expect(stats.completedCount).toBe(2);
    expect(stats.averageScore).toBe(70);
    expect(stats.averageDurationSeconds).toBe(110);
    expect(stats.completionRatePercent).toBeCloseTo(66.67, 1);
    expect(stats.abandonedCount).toBe(0);
  });

  it("counts only COMPLETED in completedCount, not ABANDONED", () => {
    const stats = computeCreatorResponseStats([
      makeAttempt({ id: "a1", status: "COMPLETED", score: 100 }),
      makeAttempt({ id: "a2", status: "ABANDONED", score: null }),
    ]);
    expect(stats.completedCount).toBe(1);
    expect(stats.abandonedCount).toBe(1);
    expect(stats.averageScore).toBe(100);
  });

  it("uses participantName for PSEUDONYM attempts", () => {
    const rows = mapAttemptsToDetailRows([
      makeAttempt({
        id: "pseudo",
        identityMode: "PSEUDONYM",
        participantName: "Camille",
      }),
    ]);
    expect(rows[0]?.participantLabel).toBe("Camille");
    expect(rows[0]?.isAnonymous).toBe(false);
    expect(rows[0]?.participantEmailHint).toBeNull();
  });

  it("shows discreet email hint for NAME_EMAIL attempts", () => {
    const rows = mapAttemptsToDetailRows([
      makeAttempt({
        id: "named",
        identityMode: "NAME_EMAIL",
        participantName: "Ada",
        participantEmail: "ada@test.com",
      }),
    ]);
    expect(rows[0]?.participantLabel).toBe("Ada");
    expect(rows[0]?.participantEmailHint).toBe("ada@test.com");
  });

  it("maps attempts with anonymous numbers for the table", () => {
    const rows = mapAttemptsToDetailRows([
      makeAttempt({ id: "first", startedAt: new Date("2026-05-20T09:00:00Z") }),
      makeAttempt({ id: "second", startedAt: new Date("2026-05-21T09:00:00Z") }),
    ]);

    expect(rows[0]?.id).toBe("second");
    expect(rows.find((r) => r.id === "first")?.anonymousNumber).toBe(1);
    expect(rows.find((r) => r.id === "second")?.anonymousNumber).toBe(2);
  });

  it("falls back to started/finished delta when durationSeconds is missing", () => {
    const duration = resolveAttemptDurationSeconds({
      durationSeconds: null,
      startedAt: new Date("2026-05-20T10:00:00Z"),
      finishedAt: new Date("2026-05-20T10:01:30Z"),
    });
    expect(duration).toBe(90);
  });

  it("marks attempts as detailsPurged when link was purged and answers are gone", () => {
    expect(resolveAttemptDetailsPurged(new Date("2026-05-01T00:00:00Z"), 0)).toBe(true);
    expect(resolveAttemptDetailsPurged(new Date("2026-05-01T00:00:00Z"), 2)).toBe(false);
    expect(resolveAttemptDetailsPurged(null, 0)).toBe(false);

    const rows = mapAttemptsToDetailRows([
      makeAttempt({
        id: "purged",
        quizLinkDetailsPurgedAt: new Date("2026-05-01T00:00:00Z"),
        questionsAnswered: 0,
      }),
      makeAttempt({ id: "active", questionsAnswered: 3 }),
    ]);

    expect(rows.find((row) => row.id === "purged")?.detailsPurged).toBe(true);
    expect(rows.find((row) => row.id === "active")?.detailsPurged).toBe(false);
  });
});
