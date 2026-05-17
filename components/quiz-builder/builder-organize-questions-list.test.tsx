/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BuilderOrganizeQuestionsList } from "./builder-organize-questions-list";
import type { Question } from "@/types/quiz-builder";

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

const makeQuestion = (id: string, label: string): Question => ({
  id,
  type: "MULTIPLE_CHOICE",
  label,
  options: [
    { id: `${id}-o1`, label: "A", isCorrect: true },
    { id: `${id}-o2`, label: "B", isCorrect: false },
  ],
});

describe("BuilderOrganizeQuestionsList", () => {
  it("shows question numbers before each preview in list order", () => {
    const questions = [
      makeQuestion("q1", "Première question"),
      makeQuestion("q2", "Deuxième question"),
    ];

    render(
      <BuilderOrganizeQuestionsList
        locale="fr"
        questions={questions}
        onReorder={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onDeleteQuestion={vi.fn()}
        onEditQuestion={vi.fn()}
      />,
    );

    expect(screen.getByText("1.")).toBeTruthy();
    expect(screen.getByText("2.")).toBeTruthy();
    expect(screen.getByText("Première question")).toBeTruthy();
    expect(screen.getByText("Deuxième question")).toBeTruthy();
  });

  it("exposes question number in the row edit control aria-label", () => {
    render(
      <BuilderOrganizeQuestionsList
        locale="fr"
        questions={[makeQuestion("q1", "Ma question")]}
        onReorder={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onDeleteQuestion={vi.fn()}
        onEditQuestion={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Question 1" })).toBeTruthy();
  });
});
