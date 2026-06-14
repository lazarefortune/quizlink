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
import { t } from "@/lib/i18n";

import { QuizShareLinkDialog } from "./quiz-share-link-dialog";

describe("QuizShareLinkDialog", () => {
  it("shows unlock action instead of copy when free quota is reached", async () => {
    const onUnlock = vi.fn();

    render(
      <QuizShareLinkDialog
        quizId="quiz-1"
        quizStatus="ACTIVE"
        open
        onOpenChange={() => undefined}
        canAcceptResponses={false}
        onUnlock={onUnlock}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: t("fr", "dashboard.quizQuota.unlockToShare"),
      }),
    ).toBeTruthy();
    expect(screen.getByText(t("fr", "dashboard.quizQuota.limitReached"))).toBeTruthy();
    expect(screen.queryByText("Copier le lien")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: t("fr", "dashboard.quizQuota.unlockToShare") }),
    );
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it("loads and copies link when responses are accepted", async () => {
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
        canAcceptResponses
      />,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue(/\/quiz\/abc123$/)).toBeTruthy();
    });

    expect(screen.getByRole("button", { name: "Copier le lien" })).toBeTruthy();
  });
});
