export type QuizDetailFunnelStep = {
  key: "opens" | "started" | "completed";
  value: number;
};

export type QuizDetailAudienceSlice = {
  key: "anonymous" | "identified";
  value: number;
};

export type QuizDetailStatsInput = {
  totalResponses: number;
  totalStarted: number;
  totalOpenCount: number;
  anonymousCompletedCount: number;
  identifiedCompletedCount: number;
  globalScoredCount: number;
  globalScoreAverage: number;
  globalBestScore: number | null;
  globalLowestScore: number | null;
  globalAverageDurationSeconds: number | null;
};

export function computeQuizCompletionRatePercent(stats: {
  totalResponses: number;
  totalStarted: number;
}): number {
  if (stats.totalStarted <= 0) {
    return 0;
  }
  return (stats.totalResponses / stats.totalStarted) * 100;
}

export function buildQuizFunnelSteps(stats: {
  totalOpenCount: number;
  totalStarted: number;
  totalResponses: number;
}): QuizDetailFunnelStep[] {
  return [
    { key: "opens", value: stats.totalOpenCount },
    { key: "started", value: stats.totalStarted },
    { key: "completed", value: stats.totalResponses },
  ];
}

export function buildQuizAudienceSlices(stats: {
  anonymousCompletedCount: number;
  identifiedCompletedCount: number;
}): QuizDetailAudienceSlice[] {
  return [
    { key: "anonymous", value: stats.anonymousCompletedCount },
    { key: "identified", value: stats.identifiedCompletedCount },
  ];
}

export function shouldShowQuizDetailCharts(
  funnelSteps: QuizDetailFunnelStep[],
  audienceSlices: QuizDetailAudienceSlice[],
): boolean {
  const funnelTotal = funnelSteps.reduce((sum, step) => sum + step.value, 0);
  const audienceTotal = audienceSlices.reduce((sum, slice) => sum + slice.value, 0);
  return funnelTotal > 0 || audienceTotal > 0;
}

export function pickPrimaryFourthKpi(stats: QuizDetailStatsInput): "averageTime" | "bestScore" {
  if (stats.globalAverageDurationSeconds != null && stats.globalAverageDurationSeconds > 0) {
    return "averageTime";
  }
  return "bestScore";
}

export function formatDurationShort(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins <= 0) {
    return `${secs}s`;
  }
  return `${mins}m ${secs}s`;
}
