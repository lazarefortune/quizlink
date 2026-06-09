/* @vitest-environment jsdom */

import type { ComponentPropsWithoutRef } from "react";

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuizListCard, type QuizListCardData } from "@/components/dashboard/quiz-list-card";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/ui/dropdown-menu", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/components/ui/dropdown-menu")>();
  const { DropdownMenu: DropdownMenuRoot } = mod;
  return {
    ...mod,
    DropdownMenu: (props: ComponentPropsWithoutRef<typeof DropdownMenuRoot>) => (
      <DropdownMenuRoot {...props} open />
    ),
  };
});

const activeQuiz: QuizListCardData = {
  id: "quiz-1",
  name: "Mon quiz",
  status: "ACTIVE",
  questionCount: 5,
  attemptCount: 2,
};

describe("QuizListCard", () => {
  it("shows copy link action in dropdown for active quizzes", () => {
    const onCopyLink = vi.fn();

    render(
      <QuizListCard
        quiz={activeQuiz}
        locale="fr"
        playLoadingQuizId={null}
        onPlay={vi.fn()}
        onCopyLink={onCopyLink}
        onEdit={vi.fn()}
        onView={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("menuitem", { name: "Copier le lien" }));

    expect(onCopyLink).toHaveBeenCalledWith("quiz-1");
  });

  it("does not show copy link action for draft quizzes", () => {
    render(
      <QuizListCard
        quiz={{ ...activeQuiz, status: "DRAFT" }}
        locale="fr"
        playLoadingQuizId={null}
        onPlay={vi.fn()}
        onCopyLink={vi.fn()}
        onEdit={vi.fn()}
        onView={vi.fn()}
      />,
    );

    expect(screen.queryByRole("menuitem", { name: "Copier le lien" })).toBeNull();
  });
});
