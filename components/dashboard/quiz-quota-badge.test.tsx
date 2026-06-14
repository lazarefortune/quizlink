/* @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { t, type Locale } from "@/lib/i18n";

import { QuizQuotaBadge } from "./quiz-quota-badge";

describe("QuizQuotaBadge", () => {
  it("shows free progress for FREE_AVAILABLE", () => {
    render(
      <QuizQuotaBadge
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

    expect(screen.getByText("12/20 réponses")).toBeTruthy();
  });

  it("shows limit reached label for FREE_LIMIT_REACHED", () => {
    render(
      <QuizQuotaBadge
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

    expect(screen.getByText(t("fr", "dashboard.quizQuota.limitReached"))).toBeTruthy();
    expect(screen.getByRole("link", { name: t("fr", "dashboard.quizQuota.unlock") })).toBeTruthy();
  });
});
