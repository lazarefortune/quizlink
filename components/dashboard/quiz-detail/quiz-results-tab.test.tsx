/* @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { QuizDetailStatsInput } from "@/lib/dashboard/quiz-detail-stats";

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" as const }),
}));

vi.mock("@/components/ui/playful-section-title", () => ({
  PlayfulSectionTitle: ({
    children,
    as: Tag = "h2",
    className,
  }: {
    children: React.ReactNode;
    as?: "h2" | "h3";
    className?: string;
  }) => {
    const Element = Tag;
    return <Element className={className}>{children}</Element>;
  },
}));

vi.mock("./quiz-attempts-section", () => ({
  QuizAttemptsSection: () => <div data-testid="attempts-section" />,
}));

vi.mock("./quiz-detail-charts", () => ({
  QuizDetailCharts: () => <div>Entonnoir de participation</div>,
}));

vi.mock("./quiz-question-analysis-section", () => ({
  QuizQuestionAnalysisSection: () => <div>Analyse des questions</div>,
}));

vi.mock("./locked-advanced-stats-card", () => ({
  LockedAdvancedStatsCard: () => <div data-testid="locked-advanced-stats-card" />,
}));

import { QuizResultsTab } from "./quiz-results-tab";

const baseStats: QuizDetailStatsInput = {
  totalResponses: 5,
  totalStarted: 6,
  totalOpenCount: 10,
  anonymousCompletedCount: 4,
  identifiedCompletedCount: 1,
  globalScoredCount: 5,
  globalScoreAverage: 72,
  globalBestScore: 95,
  globalLowestScore: 40,
  globalAverageDurationSeconds: 120,
  completionRatePercent: 83.3,
  totalAttemptCount: 8,
  lockedAttemptCount: 5,
  purgedAttemptCount: 0,
  hasPurgedDetails: false,
  detailsFullyPurged: false,
  attempts: [
    {
      id: "att-1",
      participantLabel: "Participant anonyme #1",
      participantEmailHint: null,
      anonymousNumber: 1,
      isAnonymous: true,
      score: 80,
      durationSeconds: 100,
      status: "COMPLETED",
      startedAt: new Date("2026-05-20T10:00:00Z"),
      finishedAt: new Date("2026-05-20T10:05:00Z"),
      questionsAnswered: 5,
      totalQuestions: 5,
      detailsPurged: false,
    },
  ],
  resultAccess: {
    responsesStartedAt: new Date("2026-05-15T12:00:00Z"),
    isUnlocked: false,
    unlockedBy: null,
    detailedPreviewLimit: 3,
  },
  quotaStatus: {
    completedResponses: 5,
    freeLimit: 20,
    remainingFreeResponses: 15,
    hasReachedFreeLimit: false,
    isUnlocked: false,
    unlockedBy: null,
    label: "FREE_AVAILABLE",
    canAcceptResponses: true,
  },
};

describe("QuizResultsTab", () => {
  it("shows essential KPIs only and hides advanced charts in free tier", () => {
    render(
      <QuizResultsTab
        quizStatus="ACTIVE"
        stats={baseStats}
        questions={[]}
        questionInsights={[]}
        onShare={() => undefined}
        onOpenPaywall={() => undefined}
      />,
    );

    expect(screen.getByText("Statistiques globales")).toBeTruthy();
    expect(screen.getByText("parties jouées")).toBeTruthy();
    expect(screen.getByText("score moyen")).toBeTruthy();
    expect(screen.queryByText("Entonnoir de participation")).toBeNull();
    expect(screen.queryByText("Analyse des questions")).toBeNull();
    expect(screen.queryByText("Anonymes")).toBeNull();
    expect(screen.queryByTestId("quiz-unlock-paywall")).toBeNull();
    expect(screen.getByTestId("locked-advanced-stats-card")).toBeTruthy();
  });

  it("does not show locked advanced stats block when there are no attempts", () => {
    render(
      <QuizResultsTab
        quizStatus="ACTIVE"
        stats={{
          ...baseStats,
          totalResponses: 0,
          totalAttemptCount: 0,
          attempts: [],
          lockedAttemptCount: 0,
        }}
        questions={[]}
        questionInsights={[]}
        onShare={() => undefined}
        onOpenPaywall={() => undefined}
      />,
    );

    expect(screen.getByText("Ton quiz n'a pas encore reçu de réponses.")).toBeTruthy();
    expect(screen.queryByTestId("locked-advanced-stats-card")).toBeNull();
  });

  it("does not show locked advanced stats block when unlocked", () => {
    render(
      <QuizResultsTab
        quizStatus="ACTIVE"
        stats={{
          ...baseStats,
          lockedAttemptCount: 0,
          quotaStatus: {
            ...baseStats.quotaStatus!,
            isUnlocked: true,
            unlockedBy: "COINS",
            label: "UNLOCKED",
            canAcceptResponses: true,
          },
        }}
        questions={[]}
        questionInsights={[]}
        onShare={() => undefined}
        onOpenPaywall={() => undefined}
      />,
    );

    expect(screen.queryByTestId("quiz-unlock-paywall")).toBeNull();
    expect(screen.queryByTestId("locked-advanced-stats-card")).toBeNull();
    expect(screen.getByText("Entonnoir de participation")).toBeTruthy();
  });

  it("shows advanced sections when unlocked", () => {
    render(
      <QuizResultsTab
        quizStatus="ACTIVE"
        stats={{
          ...baseStats,
          lockedAttemptCount: 0,
          quotaStatus: {
            ...baseStats.quotaStatus!,
            isUnlocked: true,
            unlockedBy: "COINS",
            label: "UNLOCKED",
            canAcceptResponses: true,
          },
        }}
        questions={[
          {
            id: "q1",
            order: 1,
            type: "MULTIPLE_CHOICE",
            label: "Q?",
            image: null,
            imageKey: null,
            explanation: null,
            options: [],
          },
        ]}
        questionInsights={[]}
        onShare={() => undefined}
        onOpenPaywall={() => undefined}
      />,
    );

    expect(screen.getByText("Entonnoir de participation")).toBeTruthy();
    expect(screen.getByText("Analyse des questions")).toBeTruthy();
  });

  it("does not show compact paywall card when quiz is not unlocked", () => {
    render(
      <QuizResultsTab
        quizStatus="ACTIVE"
        stats={baseStats}
        questions={[]}
        questionInsights={[]}
        onShare={() => undefined}
        onOpenPaywall={() => undefined}
      />,
    );

    expect(screen.queryByTestId("quiz-unlock-paywall")).toBeNull();
    expect(screen.getByTestId("locked-advanced-stats-card")).toBeTruthy();
  });

  it("shows only global stats when details were fully purged", () => {
    render(
      <QuizResultsTab
        quizStatus="ACTIVE"
        stats={{
          ...baseStats,
          detailsFullyPurged: true,
          hasPurgedDetails: true,
          lockedAttemptCount: 0,
        }}
        questions={[]}
        questionInsights={[]}
        onShare={() => undefined}
        onOpenPaywall={() => undefined}
      />,
    );

    expect(screen.getByText("Statistiques globales")).toBeTruthy();
    expect(
      screen.getByText(
        "Les réponses détaillées ont été supprimées lors de la purge automatique. Seules les statistiques globales restent disponibles.",
      ),
    ).toBeTruthy();
    expect(screen.queryByTestId("locked-advanced-stats-card")).toBeNull();
    expect(screen.queryByText("Entonnoir de participation")).toBeNull();
    expect(screen.queryByText("Analyse des questions")).toBeNull();
    expect(screen.queryByTestId("attempts-section")).toBeNull();
  });
});
