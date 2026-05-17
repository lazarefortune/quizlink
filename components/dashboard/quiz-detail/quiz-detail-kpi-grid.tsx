"use client";

import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import {
  computeQuizCompletionRatePercent,
  formatDurationShort,
  pickPrimaryFourthKpi,
  type QuizDetailStatsInput,
} from "@/lib/dashboard/quiz-detail-stats";

type QuizDetailKpiGridProps = {
  stats: QuizDetailStatsInput;
};

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export function QuizDetailKpiGrid({ stats }: QuizDetailKpiGridProps) {
  const { locale } = useLocale();
  const completionRate = computeQuizCompletionRatePercent(stats);
  const fourthKpi = pickPrimaryFourthKpi(stats);

  const primaryFourthValue =
    fourthKpi === "averageTime" && stats.globalAverageDurationSeconds != null
      ? formatDurationShort(stats.globalAverageDurationSeconds)
      : stats.globalBestScore != null
        ? `${stats.globalBestScore.toFixed(1)}%`
        : "-";

  const primaryFourthLabel =
    fourthKpi === "averageTime"
      ? t(locale, "dashboard.averageTimeLabel")
      : t(locale, "dashboard.bestScoreLabel");

  return (
    <div className="space-y-3">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t(locale, "dashboard.responsesCardTitle")}
          value={String(stats.totalResponses)}
        />
        <KpiCard
          label={t(locale, "dashboard.completionRate")}
          value={`${completionRate.toFixed(1)}%`}
        />
        <KpiCard
          label={t(locale, "dashboard.averageScoreGlobal")}
          value={
            stats.globalScoredCount > 0
              ? `${stats.globalScoreAverage.toFixed(1)}%`
              : "-"
          }
        />
        <KpiCard label={primaryFourthLabel} value={primaryFourthValue} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label={t(locale, "dashboard.responsesAnonymousCard")}
          value={String(stats.anonymousCompletedCount)}
        />
        <KpiCard
          label={t(locale, "dashboard.opensLabel")}
          value={String(stats.totalOpenCount)}
        />
        <KpiCard
          label={t(locale, "dashboard.startedLabel")}
          value={String(stats.totalStarted)}
        />
        <KpiCard
          label={t(locale, "dashboard.bestScoreLabel")}
          value={
            stats.globalBestScore != null ? `${stats.globalBestScore.toFixed(1)}%` : "-"
          }
        />
        <KpiCard
          label={t(locale, "dashboard.worstScoreLabel")}
          value={
            stats.globalLowestScore != null
              ? `${stats.globalLowestScore.toFixed(1)}%`
              : "-"
          }
        />
      </section>
    </div>
  );
}
