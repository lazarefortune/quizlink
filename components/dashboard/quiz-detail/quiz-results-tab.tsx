"use client";

import { Share2 } from "lucide-react";

import type { QuizContentQuestion } from "@/app/(app)/dashboard/quiz/[quizId]/actions";
import { Button } from "@/components/ui/button";
import type { QuestionInsight } from "@/lib/dashboard/aggregate-question-insights";
import type { QuizDetailStatsInput } from "@/lib/dashboard/quiz-detail-stats";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

import { QuizDetailCharts } from "./quiz-detail-charts";
import { QuizDetailKpiGrid } from "./quiz-detail-kpi-grid";
import { QuizQuestionAnalysisSection } from "./quiz-question-analysis-section";

type QuizResultsTabProps = {
  quizStatus: QuizLifecycleStatus;
  stats: QuizDetailStatsInput;
  questions: QuizContentQuestion[];
  questionInsights: QuestionInsight[];
  onShare: () => void;
};

export function QuizResultsTab({
  quizStatus,
  stats,
  questions,
  questionInsights,
  onShare,
}: QuizResultsTabProps) {
  const { locale } = useLocale();
  const hasNoResponses = stats.totalResponses === 0;

  if (quizStatus === "DRAFT") {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          {t(locale, "dashboard.resultsUnavailableDraft")}
        </p>
      </div>
    );
  }

  if (quizStatus === "ARCHIVED") {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          {t(locale, "dashboard.resultsUnavailableArchived")}
        </p>
      </div>
    );
  }

  if (hasNoResponses) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
        <h2 className="text-lg font-semibold">{t(locale, "dashboard.noResponsesEmptyTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(locale, "dashboard.noResponsesEmptyDescription")}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-6 gap-2"
          onClick={onShare}
        >
          <Share2 className="h-4 w-4" />
          {t(locale, "dashboard.shareQuizCta")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <QuizDetailKpiGrid stats={stats} />
      <QuizDetailCharts
        totalOpenCount={stats.totalOpenCount}
        totalStarted={stats.totalStarted}
        totalResponses={stats.totalResponses}
        anonymousCompletedCount={stats.anonymousCompletedCount}
        identifiedCompletedCount={stats.identifiedCompletedCount}
      />
      <QuizQuestionAnalysisSection questions={questions} insights={questionInsights} />
    </div>
  );
}
