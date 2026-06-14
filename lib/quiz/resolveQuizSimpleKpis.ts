import type { computeCreatorResponseStats } from "@/lib/dashboard/creator-response-attempts";

import type { QuizResponseAggregatesSnapshot } from "./quiz-response-aggregates";

export type QuizSimpleKpisSource = "aggregates" | "attempts";

export type QuizSimpleKpis = {
  totalResponses: number;
  totalStarted: number;
  totalAbandoned: number;
  completionRatePercent: number;
  globalScoreAverage: number;
  globalScoredCount: number;
  globalAverageDurationSeconds: number | null;
  source: QuizSimpleKpisSource;
};

type AttemptStats = ReturnType<typeof computeCreatorResponseStats>;

/**
 * Resolves dashboard simple KPIs from persisted aggregates when available,
 * otherwise falls back to attempt-based computation.
 */
export function resolveQuizSimpleKpis(
  aggregate: QuizResponseAggregatesSnapshot | null,
  attemptStats: AttemptStats,
  legacyTotalStarted = 0,
): QuizSimpleKpis {
  if (aggregate) {
    return {
      totalResponses: aggregate.totalCompleted,
      totalStarted: aggregate.totalStarted,
      totalAbandoned: aggregate.totalAbandoned,
      completionRatePercent: aggregate.completionRatePercent,
      globalScoreAverage: aggregate.averageScorePercent ?? 0,
      globalScoredCount:
        aggregate.averageScorePercent != null ? aggregate.totalCompleted : 0,
      globalAverageDurationSeconds: aggregate.averageDurationSeconds,
      source: "aggregates",
    };
  }

  const totalStarted =
    attemptStats.totalStarted > 0 ? attemptStats.totalStarted : legacyTotalStarted;

  return {
    totalResponses: attemptStats.completedCount,
    totalStarted,
    totalAbandoned: attemptStats.abandonedCount,
    completionRatePercent: attemptStats.completionRatePercent,
    globalScoreAverage: attemptStats.averageScore,
    globalScoredCount: attemptStats.scoredCount,
    globalAverageDurationSeconds: attemptStats.averageDurationSeconds,
    source: "attempts",
  };
}

export type QuizSimpleKpisComparisonDiff = {
  field: string;
  aggregateValue: number | null;
  attemptsValue: number | null;
};

const KPI_COMPARE_TOLERANCE = 0.01;

function valuesDiffer(
  aggregateValue: number | null,
  attemptsValue: number | null,
): boolean {
  if (aggregateValue == null && attemptsValue == null) {
    return false;
  }

  if (aggregateValue == null || attemptsValue == null) {
    return true;
  }

  return Math.abs(aggregateValue - attemptsValue) > KPI_COMPARE_TOLERANCE;
}

/**
 * Debug helper to verify aggregate rows match attempt-derived stats after backfill.
 */
export function compareQuizSimpleKpisWithAggregates(
  aggregate: QuizResponseAggregatesSnapshot,
  attemptStats: AttemptStats,
): {
  matches: boolean;
  diffs: QuizSimpleKpisComparisonDiff[];
} {
  const attemptsAverageScore =
    attemptStats.scoredCount > 0 ? attemptStats.averageScore : null;

  const pairs: QuizSimpleKpisComparisonDiff[] = [
    {
      field: "totalCompleted",
      aggregateValue: aggregate.totalCompleted,
      attemptsValue: attemptStats.completedCount,
    },
    {
      field: "totalStarted",
      aggregateValue: aggregate.totalStarted,
      attemptsValue: attemptStats.totalStarted,
    },
    {
      field: "totalAbandoned",
      aggregateValue: aggregate.totalAbandoned,
      attemptsValue: attemptStats.abandonedCount,
    },
    {
      field: "completionRatePercent",
      aggregateValue: aggregate.completionRatePercent,
      attemptsValue: attemptStats.completionRatePercent,
    },
    {
      field: "averageScorePercent",
      aggregateValue: aggregate.averageScorePercent,
      attemptsValue: attemptsAverageScore,
    },
    {
      field: "averageDurationSeconds",
      aggregateValue: aggregate.averageDurationSeconds,
      attemptsValue: attemptStats.averageDurationSeconds,
    },
  ];

  const diffs = pairs.filter((pair) =>
    valuesDiffer(pair.aggregateValue, pair.attemptsValue),
  );

  return {
    matches: diffs.length === 0,
    diffs,
  };
}
