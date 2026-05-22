import { describe, expect, it } from "vitest";

import {
  buildAnonymousAttemptIndexMap,
  computeCreatorResponseStats,
  formatAnonymousParticipantLabel,
  mapAttemptsToDetailRows,
  resolveAttemptDurationSeconds,
} from "./creator-response-attempts";

const baseDate = new Date("2026-05-20T10:00:00Z");

function makeAttempt(
  overrides: Partial<{
    id: string;
    identityMode: string;
    participantId: string | null;
    status: string;
    score: number | null;
    durationSeconds: number | null;
    startedAt: Date;
    finishedAt: Date | null;
  }> = {},
) {
  return {
    id: "a1",
    participantId: null,
    identityMode: "ANONYMOUS",
    score: 80,
    status: "COMPLETED",
    startedAt: baseDate,
    finishedAt: new Date("2026-05-20T10:05:00Z"),
    durationSeconds: 300,
    participant: null,
    answers: [{ id: "ans-1" }],
    totalQuestions: 5,
    ...overrides,
  };
}

describe("creator-response-attempts", () => {
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
});
