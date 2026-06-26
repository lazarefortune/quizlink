/* @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuizFreeResponsesGaugeCard } from "./quiz-free-responses-gauge-card";
import { t } from "@/lib/i18n";
import type { QuizResponseQuotaStatus } from "@/lib/quiz/quizResponseQuotaStatus";

const freeAvailableStatus: QuizResponseQuotaStatus = {
  completedResponses: 8,
  freeLimit: 20,
  remainingFreeResponses: 12,
  hasReachedFreeLimit: false,
  isUnlocked: false,
  unlockedBy: null,
  label: "FREE_AVAILABLE",
  canAcceptResponses: true,
};

const limitReachedStatus: QuizResponseQuotaStatus = {
  ...freeAvailableStatus,
  completedResponses: 20,
  remainingFreeResponses: 0,
  hasReachedFreeLimit: true,
  label: "FREE_LIMIT_REACHED",
  canAcceptResponses: false,
};

describe("QuizFreeResponsesGaugeCard", () => {
  it("renders playful gauge with progress and flame icon", () => {
    render(<QuizFreeResponsesGaugeCard quotaStatus={freeAvailableStatus} locale="fr" />);

    expect(screen.getByTestId("quiz-free-responses-gauge-card")).toBeTruthy();
    expect(screen.getByText(t("fr", "dashboard.quizQuota.gaugeTitle"))).toBeTruthy();
    expect(screen.getByText("8 / 20")).toBeTruthy();
    expect(screen.getByTestId("quiz-free-responses-gauge-flame").getAttribute("src")).toContain(
      "fire-svgrepo-com.svg",
    );
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("8");
    expect(screen.getByRole("progressbar").getAttribute("aria-valuemax")).toBe("20");
  });

  it("calls onUnlock when CTA is clicked", () => {
    const onUnlock = vi.fn();

    render(
      <QuizFreeResponsesGaugeCard
        quotaStatus={freeAvailableStatus}
        locale="fr"
        onUnlock={onUnlock}
      />,
    );

    fireEvent.click(screen.getByTestId("quiz-free-responses-gauge-unlock"));
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it("shows primary unlock label when free limit is reached", () => {
    render(
      <QuizFreeResponsesGaugeCard
        quotaStatus={limitReachedStatus}
        locale="fr"
        onUnlock={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: t("fr", "dashboard.quizQuota.unlockQuiz") }),
    ).toBeTruthy();
    expect(screen.getByText("20 / 20")).toBeTruthy();
  });
});
