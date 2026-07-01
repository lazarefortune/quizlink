/* @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { t } from "@/lib/i18n";

import { QuizQuotaBar } from "./quiz-quota-bar";

describe("QuizQuotaBar", () => {
  it("shows free progress in the bar for FREE_AVAILABLE", () => {
    render(
      <QuizQuotaBar
        locale="fr"
        quotaStatus={{
          completedResponses: 12,
          freeLimit: 20,
          remainingFreeResponses: 8,
          hasReachedFreeLimit: false,
          isUnlocked: false,
          unlockedBy: null,
          label: "FREE_AVAILABLE",
          canAcceptResponses: true,
        }}
      />,
    );

    expect(screen.getByText("12 / 20")).toBeTruthy();
    expect(screen.getByTestId("quiz-quota-bar-flame")).toBeTruthy();
  });

  it("shows full progress and unlock link for FREE_LIMIT_REACHED", () => {
    render(
      <QuizQuotaBar
        locale="fr"
        quotaStatus={{
          completedResponses: 20,
          freeLimit: 20,
          remainingFreeResponses: 0,
          hasReachedFreeLimit: true,
          isUnlocked: false,
          unlockedBy: null,
          label: "FREE_LIMIT_REACHED",
          canAcceptResponses: false,
        }}
        unlockHref="/dashboard/quiz/quiz-1?unlock=1"
      />,
    );

    expect(screen.getByText("20 / 20")).toBeTruthy();
    expect(screen.getByRole("link", { name: t("fr", "dashboard.quizQuota.unlock") })).toBeTruthy();
  });
});
