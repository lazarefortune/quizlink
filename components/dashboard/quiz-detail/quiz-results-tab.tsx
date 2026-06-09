"use client";

import { Share2 } from "lucide-react";

import type { QuizContentQuestion } from "@/app/(app)/dashboard/quiz/[quizId]/actions";
import { Button } from "@/components/ui/button";
import type { QuestionInsight } from "@/lib/dashboard/aggregate-question-insights";
import type { QuizDetailStatsInput } from "@/lib/dashboard/quiz-detail-stats";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

import { LockedAdvancedStatsCard } from "./locked-advanced-stats-card";
import { QuizAttemptsSection } from "./quiz-attempts-section";
import { QuizDetailCharts } from "./quiz-detail-charts";
import { QuizDetailKpiGrid } from "./quiz-detail-kpi-grid";
import { QuizQuestionAnalysisSection } from "./quiz-question-analysis-section";
import { PlayfulSectionTitle } from "@/components/ui/playful-section-title";

type QuizResultsTabProps = {
  quizStatus: QuizLifecycleStatus;
  stats: QuizDetailStatsInput;
  questions: QuizContentQuestion[];
  questionInsights: QuestionInsight[];
  onShare: () => void;
  onOpenPaywall: () => void;
};

export function QuizResultsTab({
  quizStatus,
  stats,
  questions,
  questionInsights,
  onShare,
  onOpenPaywall,
}: QuizResultsTabProps) {
  const { locale } = useLocale();
  const hasNoResponses = stats.totalResponses === 0;
  const isUnlocked = stats.campaign?.isUnlocked ?? false;
  const detailsFullyPurged = stats.detailsFullyPurged;
  const showDetailedInsights = isUnlocked && !detailsFullyPurged;

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
        <PlayfulSectionTitle className="text-lg font-semibold">
          {t(locale, "dashboard.noResponsesYet")}
        </PlayfulSectionTitle>
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
          {t(locale, "dashboard.shareQuiz")}
        </Button>
      </div>
    );
  }

  if (detailsFullyPurged) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <PlayfulSectionTitle className="text-xl font-semibold">
            {t(locale, "dashboard.resultsSummaryTitle")}
          </PlayfulSectionTitle>
          <p className="text-sm text-muted-foreground">
            {t(locale, "dashboard.resultsDetailsPurgedNotice")}
          </p>
        </div>

        <QuizDetailKpiGrid stats={stats} moreStatsAvailable={false} />
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <div>
        <div className="mb-4">
          <PlayfulSectionTitle className="text-2xl font-semibold text-zinc-700 dark:text-zinc-300">
            {t(locale, "dashboard.resultsSummaryTitle")}
          </PlayfulSectionTitle>
        </div>

        <QuizDetailKpiGrid
          stats={stats}
          moreStatsAvailable={showDetailedInsights}
        />
      </div>

      {stats.attempts.length > 0 || stats.lockedAttemptCount > 0 ? (
        <QuizAttemptsSection
          attempts={stats.attempts}
          totalAttemptCount={stats.totalAttemptCount}
          lockedAttemptCount={stats.lockedAttemptCount}
          detailedPreviewLimit={stats.campaign?.detailedPreviewLimit ?? 3}
          isUnlocked={isUnlocked}
          onUnlockClick={onOpenPaywall}
        />
      ) : null}

      {!showDetailedInsights && stats.totalAttemptCount > 0 ? (
        <LockedAdvancedStatsCard onUnlockClick={onOpenPaywall} />
      ) : null}

      {showDetailedInsights ? (
        <>
          <QuizDetailCharts
            totalOpenCount={stats.totalOpenCount}
            totalStarted={stats.totalStarted}
            totalResponses={stats.totalResponses}
            anonymousCompletedCount={stats.anonymousCompletedCount}
            identifiedCompletedCount={stats.identifiedCompletedCount}
          />
          <QuizQuestionAnalysisSection
            questions={questions}
            insights={questionInsights}
          />
        </>
      ) : null}
    </div>
  );
}
