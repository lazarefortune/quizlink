import { describe, expect, it } from "vitest";

import { mapRawRowToBackfillStats } from "./backfill-anonymous-quiz-link-stats";

describe("mapRawRowToBackfillStats", () => {
  it("maps computed aggregates and mirrors open metrics from started metrics", () => {
    const lastStartedAt = new Date("2026-05-10T09:00:00.000Z");
    const lastCompletedAt = new Date("2026-05-10T09:15:00.000Z");

    const result = mapRawRowToBackfillStats({
      quizLinkId: "quiz-link-1",
      startedCount: BigInt(5),
      completedCount: BigInt(3),
      scoreSum: 210.5,
      scoreCount: BigInt(3),
      bestScore: 90.5,
      lowestScore: 55,
      lastStartedAt,
      lastCompletedAt,
    });

    expect(result).toEqual({
      quizLinkId: "quiz-link-1",
      openCount: 5,
      startedCount: 5,
      completedCount: 3,
      scoreSum: 210.5,
      scoreCount: 3,
      bestScore: 90.5,
      lowestScore: 55,
      lastOpenedAt: lastStartedAt,
      lastStartedAt,
      lastCompletedAt,
    });
  });

  it("keeps nullable score and completed timestamps when no completed scores exist", () => {
    const lastStartedAt = new Date("2026-05-10T10:00:00.000Z");

    const result = mapRawRowToBackfillStats({
      quizLinkId: "quiz-link-2",
      startedCount: 2,
      completedCount: 0,
      scoreSum: null,
      scoreCount: 0,
      bestScore: null,
      lowestScore: null,
      lastStartedAt,
      lastCompletedAt: null,
    });

    expect(result).toEqual({
      quizLinkId: "quiz-link-2",
      openCount: 2,
      startedCount: 2,
      completedCount: 0,
      scoreSum: 0,
      scoreCount: 0,
      bestScore: null,
      lowestScore: null,
      lastOpenedAt: lastStartedAt,
      lastStartedAt,
      lastCompletedAt: null,
    });
  });
});
