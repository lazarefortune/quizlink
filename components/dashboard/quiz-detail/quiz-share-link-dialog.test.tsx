/* @vitest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" as const }),
}));

vi.mock("@/app/quiz-link/actions", () => ({
  createOrGetQuizLink: vi.fn(),
}));

vi.mock("@/lib/analytics/track", () => ({
  track: vi.fn(),
}));

import { createOrGetQuizLink } from "@/app/quiz-link/actions";

import { QuizShareLinkDialog } from "./quiz-share-link-dialog";

describe("QuizShareLinkDialog", () => {
  it("shows reactivate action instead of copy when link is expired", async () => {
    const onReactivate = vi.fn();

    render(
      <QuizShareLinkDialog
        quizId="quiz-1"
        quizStatus="ACTIVE"
        open
        onOpenChange={() => undefined}
        isLinkExpired
        onReactivate={onReactivate}
      />,
    );

    expect(screen.getByText("Réactiver pour partager")).toBeTruthy();
    expect(screen.queryByText("Copier le lien")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Réactiver pour partager" }));
    expect(onReactivate).toHaveBeenCalledTimes(1);
  });

  it("loads and copies link when not expired", async () => {
    vi.mocked(createOrGetQuizLink).mockResolvedValue({
      success: true,
      quizLink: { id: "link-1", token: "abc123" },
      isFirstInviteForQuiz: false,
    });

    render(
      <QuizShareLinkDialog
        quizId="quiz-1"
        quizStatus="ACTIVE"
        open
        onOpenChange={() => undefined}
        isLinkExpired={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue(/\/quiz\/abc123$/)).toBeTruthy();
    });

    expect(screen.getByRole("button", { name: "Copier le lien" })).toBeTruthy();
  });
});
