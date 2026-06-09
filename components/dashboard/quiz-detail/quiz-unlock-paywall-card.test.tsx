/* @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" as const }),
}));

import { QuizUnlockPaywallCard } from "./quiz-unlock-paywall-card";

describe("QuizUnlockPaywallCard", () => {
  it("renders compact copy and opens paywall on click", () => {
    const onUnlockClick = vi.fn();

    render(
      <QuizUnlockPaywallCard
        totalResponses={12}
        visibleGamesCount={3}
        onUnlockClick={onUnlockClick}
      />,
    );

    expect(screen.getByTestId("quiz-unlock-paywall")).toBeTruthy();
    expect(
      screen.getByText(
        "Ton quiz a reçu 12 réponses. Tu peux consulter 3 parties gratuitement.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Débloquer les réponses" }));
    expect(onUnlockClick).toHaveBeenCalled();
  });
});
