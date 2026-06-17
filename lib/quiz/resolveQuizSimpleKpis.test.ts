import { describe, expect, it } from "vitest";

import { computeCreatorResponseStats } from "@/lib/dashboard/creator-response-attempts";

import type { QuizResponseAggregatesSnapshot } from "./quiz-response-aggregates";
import {
  compareQuizSimpleKpisWithAggregates,
  resolveQuizSimpleKpis,
} from "./resolveQuizSimpleKpis";

const aggregateSnapshot: QuizResponseAggregatesSnapshot = {
  quizId: "quiz-1",
  totalStarted: 4,
  totalCompleted: 2,
  totalAbandoned: 1,
  averageScorePercent: 75,
  averageDurationSeconds: 300,
  completionRatePercent: 50,
};

const attemptStats = computeCreatorResponseStats([
  {
    id: "a1",
    participantId: null,
    identityMode: "ANONYMOUS",
    participantName: null,
    participantEmail: null,
    score: 50,
    status: "COMPLETED",
    startedAt: new Date("2026-05-20T10:00:00Z"),
    finishedAt: new Date("2026-05-20T10:05:00Z"),
    durationSeconds: 300,
    totalQuestions: 2,
    participant: null,
    questionsAnswered: 2,
    quizLinkDetailsPurgedAt: null,
  },
  {
    id: "a2",
    participantId: null,
    identityMode: "ANONYMOUS",
    participantName: null,
    participantEmail: null,
    score: 100,
    status: "COMPLETED",
    startedAt: new Date("2026-05-21T10:00:00Z"),
    finishedAt: new Date("2026-05-21T10:05:00Z"),
    durationSeconds: 300,
    totalQuestions: 2,
    participant: null,
    questionsAnswered: 2,
    quizLinkDetailsPurgedAt: null,
  },
  {
    id: "a3",
    participantId: null,
    identityMode: "ANONYMOUS",
    participantName: null,
    participantEmail: null,
    score: null,
    status: "ABANDONED",
    startedAt: new Date("2026-05-22T10:00:00Z"),
    finishedAt: new Date("2026-05-22T10:01:00Z"),
    durationSeconds: 60,
    totalQuestions: null,
    participant: null,
    questionsAnswered: 0,
    quizLinkDetailsPurgedAt: null,
  },
  {
    id: "a4",
    participantId: null,
    identityMode: "ANONYMOUS",
    participantName: null,
    participantEmail: null,
    score: null,
    status: "IN_PROGRESS",
    startedAt: new Date("2026-05-23T10:00:00Z"),
    finishedAt: null,
    durationSeconds: null,
    totalQuestions: null,
    participant: null,
    questionsAnswered: 0,
    quizLinkDetailsPurgedAt: null,
  },
]);

describe("resolveQuizSimpleKpis", () => {
  it("uses aggregates for simple KPIs when a row exists", () => {
    const result = resolveQuizSimpleKpis(aggregateSnapshot, attemptStats);

    expect(result).toEqual({
      totalResponses: 2,
      totalStarted: 4,
      totalAbandoned: 1,
      completionRatePercent: 50,
      globalScoreAverage: 75,
      globalScoredCount: 2,
      globalAverageDurationSeconds: 300,
      source: "aggregates",
    });
  });

  it("falls back to attempt stats when aggregates are absent", () => {
    const result = resolveQuizSimpleKpis(null, attemptStats);

    expect(result.source).toBe("attempts");
    expect(result.totalResponses).toBe(2);
    expect(result.totalStarted).toBe(4);
    expect(result.totalAbandoned).toBe(1);
    expect(result.completionRatePercent).toBe(50);
    expect(result.globalScoreAverage).toBe(75);
    expect(result.globalScoredCount).toBe(2);
    expect(result.globalAverageDurationSeconds).toBe(300);
  });

  it("uses legacy started count when attempt stats are empty", () => {
    const emptyStats = computeCreatorResponseStats([]);

    const result = resolveQuizSimpleKpis(null, emptyStats, 5);

    expect(result.totalStarted).toBe(5);
    expect(result.totalResponses).toBe(0);
    expect(result.globalScoredCount).toBe(0);
  });
});

describe("compareQuizSimpleKpisWithAggregates", () => {
  it("reports no diffs when aggregate and attempt stats align", () => {
    const alignedAggregate: QuizResponseAggregatesSnapshot = {
      quizId: "quiz-1",
      totalStarted: attemptStats.totalStarted,
      totalCompleted: attemptStats.completedCount,
      totalAbandoned: attemptStats.abandonedCount,
      averageScorePercent: attemptStats.averageScore,
      averageDurationSeconds: attemptStats.averageDurationSeconds,
      completionRatePercent: attemptStats.completionRatePercent,
    };

    const comparison = compareQuizSimpleKpisWithAggregates(
      alignedAggregate,
      attemptStats,
    );

    expect(comparison.matches).toBe(true);
    expect(comparison.diffs).toEqual([]);
  });

  it("reports diffs when values diverge", () => {
    const comparison = compareQuizSimpleKpisWithAggregates(
      {
        ...aggregateSnapshot,
        totalCompleted: 99,
        completionRatePercent: 99,
      },
      attemptStats,
    );

    expect(comparison.matches).toBe(false);
    expect(comparison.diffs.some((diff) => diff.field === "totalCompleted")).toBe(true);
  });
});
