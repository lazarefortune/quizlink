/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BuilderMobileQuizCard } from "./builder-mobile-quiz-card";

describe("BuilderMobileQuizCard", () => {
  it("renders back link, editable quiz name, status row and settings control", () => {
    render(
      <BuilderMobileQuizCard
        locale="fr"
        quizName=""
        onQuizNameChange={vi.fn()}
        getNameError={() => null}
        editorialStatus="DRAFT"
        backHref="/dashboard/quizzes"
        backLinkText="← Retour"
        onBackLinkClick={vi.fn()}
        onOpenSettings={vi.fn()}
      />,
    );

    expect(screen.getByRole("link", { name: "← Retour" })).toBeTruthy();
    expect(screen.getByText("Nom du quiz")).toBeTruthy();
    expect(screen.getByPlaceholderText("Nom de ton quiz")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Paramètres du quiz" })).toBeTruthy();
  });
});
