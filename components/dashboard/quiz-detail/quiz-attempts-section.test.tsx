/* @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" as const }),
}));

vi.mock("@/lib/date-time/timezone-provider", () => ({
  useTimeZone: () => ({ timeZone: "Europe/Paris", setTimeZone: vi.fn() }),
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

vi.mock("framer-motion", () => {
  const motionProxy = new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === "create") {
          return (Component: React.ComponentType<Record<string, unknown>>) =>
            function MotionCreatedComponent({
              children,
              initial: _initial,
              animate: _animate,
              transition: _transition,
              ...props
            }: React.ComponentProps<typeof Component> & {
              initial?: unknown;
              animate?: unknown;
              transition?: unknown;
            }) {
              return <Component {...props}>{children}</Component>;
            };
        }

        return function MotionComponent({
          children,
          initial: _initial,
          animate: _animate,
          transition: _transition,
          ...props
        }: React.ComponentProps<"div"> & {
          initial?: unknown;
          animate?: unknown;
          transition?: unknown;
        }) {
          if (prop === "tr") {
            const trProps = props as React.ComponentProps<"tr">;
            return <tr {...trProps}>{children}</tr>;
          }
          return <div {...props}>{children}</div>;
        };
      },
    },
  );

  return {
    motion: motionProxy,
    useReducedMotion: () => true,
  };
});

vi.mock("./quiz-attempt-detail-dialog", () => ({
  QuizAttemptDetailDialog: () => null,
}));

import { QuizAttemptsSection } from "./quiz-attempts-section";
import { t } from "@/lib/i18n";

const visibleAttempt = {
  id: "att-real",
  participantLabel: "Ada",
  participantEmailHint: null,
  anonymousNumber: null,
  isAnonymous: false,
  score: 90,
  durationSeconds: 60,
  status: "COMPLETED",
  startedAt: new Date("2026-05-20T10:00:00Z"),
  finishedAt: new Date("2026-05-20T10:01:00Z"),
  questionsAnswered: 3,
  totalQuestions: 3,
  detailsPurged: false,
};

const purgedAttempt = {
  ...visibleAttempt,
  id: "att-purged",
  participantLabel: "Participant anonyme #2",
  isAnonymous: true,
  anonymousNumber: 2,
  questionsAnswered: 0,
  detailsPurged: true,
};

describe("QuizAttemptsSection", () => {
  it("renders locked placeholder rows without real attempt data", () => {
    const onUnlockClick = vi.fn();

    render(
      <QuizAttemptsSection
        attempts={[visibleAttempt]}
        totalAttemptCount={6}
        lockedAttemptCount={5}
        detailedPreviewLimit={3}
        isUnlocked={false}
        onUnlockClick={onUnlockClick}
      />,
    );

    expect(screen.getByText("Ada")).toBeTruthy();
    expect(screen.getByText("Détails des parties")).toBeTruthy();
    const lockedZone = screen.getByTestId("locked-attempts-zone");
    expect(lockedZone).toBeTruthy();
    expect(lockedZone.className).toMatch(/min-h-/);
    expect(screen.getByTestId("locked-attempts-blur-layer")).toBeTruthy();
    expect(screen.getByText("5 parties masquées")).toBeTruthy();
    expect(screen.getByText("Débloque le quiz pour voir cette partie.")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: t("fr", "dashboard.unlockDialog.unlockResponses") }),
    );
    expect(onUnlockClick).toHaveBeenCalled();
    expect(screen.getByText("90.0%")).toBeTruthy();
    expect(screen.queryByText("att-hidden")).toBeNull();
  });

  it("uses singular copy when only one game is locked", () => {
    render(
      <QuizAttemptsSection
        attempts={[visibleAttempt]}
        totalAttemptCount={2}
        lockedAttemptCount={1}
        detailedPreviewLimit={1}
        isUnlocked={false}
        onUnlockClick={() => undefined}
      />,
    );

    expect(screen.getByText("1 partie masquée")).toBeTruthy();
    expect(screen.queryByText("1 parties masquées")).toBeNull();
  });

  it("shows purged badge and disables detail button for purged attempts", () => {
    render(
      <QuizAttemptsSection
        attempts={[purgedAttempt, visibleAttempt]}
        totalAttemptCount={2}
        lockedAttemptCount={0}
        detailedPreviewLimit={3}
        isUnlocked
        onUnlockClick={() => undefined}
      />,
    );

    expect(screen.getByText("Détails supprimés")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Indisponible" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Détails" })).toBeTruthy();
    expect(screen.getAllByText("90.0%")).toHaveLength(2);
  });
});
