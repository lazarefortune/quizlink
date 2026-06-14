/* @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuizCardStats } from "@/components/dashboard/quiz-card-stats-icons";

describe("QuizCardStats", () => {
  it("shows question count and results with playful labels", () => {
    render(
      <QuizCardStats
        locale="fr"
        questionCount={3}
        attemptCount={5}
        showResults
      />,
    );

    expect(screen.getByText(/3 questions/)).toBeTruthy();
    expect(screen.getByText(/5 résultats/)).toBeTruthy();
  });

  it("uses singular result label for one attempt", () => {
    render(
      <QuizCardStats
        locale="fr"
        questionCount={1}
        attemptCount={1}
        showResults
      />,
    );

    expect(screen.getByText(/1 question$/)).toBeTruthy();
    expect(screen.getByText(/1 résultat/)).toBeTruthy();
  });

  it("hides results when showResults is false", () => {
    render(
      <QuizCardStats
        locale="en"
        questionCount={2}
        attemptCount={4}
        showResults={false}
      />,
    );

    expect(screen.getByText(/2 questions/)).toBeTruthy();
    expect(screen.queryByText(/result/i)).toBeNull();
  });
});
