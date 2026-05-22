/* @vitest-environment jsdom */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" as const }),
}));

import { QuizPreviewBanner } from "./quiz-preview-banner";

describe("QuizPreviewBanner", () => {
  it("displays preview mode label and not-saved message", () => {
    render(<QuizPreviewBanner quizId="quiz-1" />);

    expect(screen.getByTestId("quiz-preview-banner")).toBeTruthy();
    expect(screen.getByText("Mode aperçu")).toBeTruthy();
    expect(
      screen.getByText("Ce test n'est pas enregistré dans les statistiques."),
    ).toBeTruthy();
  });

  it("links back to quiz detail and builder edit", () => {
    render(<QuizPreviewBanner quizId="quiz-42" />);

    expect(screen.getByRole("link", { name: "Retour au quiz" }).getAttribute("href")).toBe(
      "/dashboard/quiz/quiz-42",
    );
    expect(screen.getByRole("link", { name: "Modifier" }).getAttribute("href")).toBe(
      "/builder/quiz-42",
    );
  });
});

describe("QuizPreviewPlayer live action guard", () => {
  it("does not import persisted play or stats actions", () => {
    const playerPath = resolve(
      process.cwd(),
      "components/quiz-preview/quiz-preview-player.tsx",
    );
    const source = readFileSync(playerPath, "utf8");

    expect(source).not.toContain("submitAnswerForAttempt");
    expect(source).not.toContain("finishQuizAttempt");
    expect(source).not.toContain("startQuizAttempt");
    expect(source).not.toContain("recordAnonymous");
    expect(source).not.toContain("validateAnonymous");
    expect(source).toContain("QuizPlayLayout");
    expect(source).toContain("QuizPreviewBanner");
  });
});
