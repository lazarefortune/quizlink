/* @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { QuizLinkExpirationStatus } from "@/lib/quiz/quizLinkExpirationStatus";

import { QuizExpirationStatusCard } from "./quiz-expiration-status-card";

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" as const }),
}));

const expiredStatus: QuizLinkExpirationStatus = {
  hasStarted: true,
  isExpired: true,
  isUnlocked: false,
  acceptingResponsesUntil: new Date("2026-05-01T12:00:00.000Z"),
  status: "EXPIRED",
  titleKey: "dashboard.quizExpiration.expiredTitle",
  descriptionKey: "dashboard.quizExpiration.expiredDescription",
  listLabelKey: "dashboard.quizExpiration.listExpired",
};

const activeStatus: QuizLinkExpirationStatus = {
  hasStarted: true,
  isExpired: false,
  isUnlocked: false,
  acceptingResponsesUntil: new Date("2026-06-15T12:00:00.000Z"),
  status: "ACTIVE",
  titleKey: "dashboard.quizExpiration.activeTitle",
  descriptionKey: "dashboard.quizExpiration.activeDescription",
  listLabelKey: "dashboard.quizExpiration.listActive",
  daysRemaining: 19,
};

describe("QuizExpirationStatusCard", () => {
  it("shows expired state and reactivate action", () => {
    const onReactivate = vi.fn();

    render(
      <QuizExpirationStatusCard
        expiration={expiredStatus}
        onReactivate={onReactivate}
      />,
    );

    expect(screen.getByText("Lien expiré")).toBeTruthy();
    expect(
      screen.getByText("Ce quiz ne reçoit plus de nouvelles réponses."),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Réactiver le quiz" }));
    expect(onReactivate).toHaveBeenCalledTimes(1);
  });

  it("shows active state and extend action", () => {
    const onExtend = vi.fn();

    render(
      <QuizExpirationStatusCard expiration={activeStatus} onExtend={onExtend} />,
    );

    expect(screen.getByText("Lien actif")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Prolonger" }));
    expect(onExtend).toHaveBeenCalledTimes(1);
  });
});
