/* @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { QuizDetailStatsInput } from "@/lib/dashboard/quiz-detail-stats";

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" as const }),
}));

vi.mock("framer-motion", () => {
  const motionProxy = new Proxy(
    {},
    {
      get: (_target, prop) =>
        function MotionComponent({
          children,
          initial: _initial,
          animate: _animate,
          exit: _exit,
          transition: _transition,
          whileHover: _whileHover,
          whileTap: _whileTap,
          ...props
        }: React.ComponentProps<"div"> & {
          initial?: unknown;
          animate?: unknown;
          exit?: unknown;
          transition?: unknown;
          whileHover?: unknown;
          whileTap?: unknown;
        }) {
          const Tag = prop === "p" ? "p" : "div";
          return <Tag {...props}>{children}</Tag>;
        },
    },
  );

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: motionProxy,
    useReducedMotion: () => true,
  };
});

import { QuizDetailKpiGrid } from "./quiz-detail-kpi-grid";

const baseStats: QuizDetailStatsInput = {
  totalResponses: 10,
  totalStarted: 12,
  totalOpenCount: 20,
  anonymousCompletedCount: 7,
  identifiedCompletedCount: 3,
  globalScoredCount: 10,
  globalScoreAverage: 72,
  globalBestScore: 95,
  globalLowestScore: 40,
  globalAverageDurationSeconds: 120,
  completionRatePercent: 83.3,
  totalAttemptCount: 10,
  lockedAttemptCount: 0,
  purgedAttemptCount: 0,
  hasPurgedDetails: false,
  detailsFullyPurged: false,
  attempts: [],
  campaign: null,
};

describe("QuizDetailKpiGrid", () => {
  it("shows only primary KPIs when more stats are not available", () => {
    render(<QuizDetailKpiGrid stats={baseStats} moreStatsAvailable={false} />);

    expect(screen.getByText("parties jouées")).toBeTruthy();
    expect(screen.getByText("score moyen")).toBeTruthy();
    expect(screen.queryByTestId("quiz-detail-kpi-advanced")).toBeNull();
    expect(screen.queryByRole("button", { name: "Voir plus de stats" })).toBeNull();
  });

  it("shows toggle and expands extra KPIs when unlocked", () => {
    render(<QuizDetailKpiGrid stats={baseStats} moreStatsAvailable />);

    expect(screen.queryByTestId("quiz-detail-kpi-advanced")).toBeNull();
    expect(screen.getByRole("button", { name: "Voir plus de stats" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Voir plus de stats" }));

    expect(screen.getByTestId("quiz-detail-kpi-advanced")).toBeTruthy();
    expect(screen.getByText("parties anonymes")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Voir moins de stats" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Voir moins de stats" }));
    expect(screen.queryByTestId("quiz-detail-kpi-advanced")).toBeNull();
  });
});
