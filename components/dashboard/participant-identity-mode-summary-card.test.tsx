/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { t } from "@/lib/i18n";

import { escapeRegExp } from "./participant-identity-mode-test-helpers";

const updateActionMock = vi.fn();
const showToastMock = vi.fn();

vi.mock("@/app/(app)/dashboard/quiz/[quizId]/actions", () => ({
  updateQuizParticipantIdentityModeAction: (...args: unknown[]) => updateActionMock(...args),
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

vi.mock("@/components/ui/playful-section-title", () => ({
  PlayfulSectionTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <h2 className={className}>{children}</h2>,
}));

import { ParticipantIdentityModeSummaryCard } from "./participant-identity-mode-summary-card";

describe("ParticipantIdentityModeSummaryCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateActionMock.mockResolvedValue({
      success: true,
      participantIdentityMode: "PSEUDONYM",
    });
  });

  it("shows compact summary without the three mode options", () => {
    render(
      <ParticipantIdentityModeSummaryCard
        quizId="quiz-1"
        value="ANONYMOUS"
        locale="fr"
      />,
    );

    expect(screen.getByTestId("participant-identity-mode-summary")).toBeInTheDocument();
    expect(screen.getByText(t("fr", "participantMode.sectionTitle"))).toBeInTheDocument();
    expect(screen.getByText(t("fr", "participantMode.anonymous.label"))).toBeInTheDocument();
    expect(
      screen.getByText(t("fr", "participantMode.anonymous.shortDescription")),
    ).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("opens dialog with three options on edit click", () => {
    render(
      <ParticipantIdentityModeSummaryCard
        quizId="quiz-1"
        value="ANONYMOUS"
        locale="fr"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: t("fr", "participantMode.edit") }));

    expect(screen.getByTestId("participant-identity-mode-dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: t("fr", "participantMode.chooseTitle") }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("shows existing responses hint in dialog when applicable", () => {
    render(
      <ParticipantIdentityModeSummaryCard
        quizId="quiz-1"
        value="ANONYMOUS"
        locale="fr"
        hasExistingResponses
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: t("fr", "participantMode.edit") }));

    expect(
      screen.getByTestId("participant-identity-mode-future-hint"),
    ).toHaveTextContent(t("fr", "participantMode.existingAttemptsKeepMode"));
    expect(
      screen.getByTestId("participant-identity-mode-future-hint"),
    ).toHaveTextContent(t("fr", "participantMode.appliesToFutureAttempts"));
  });

  it("saves selected mode from dialog and updates summary", async () => {
    render(
      <ParticipantIdentityModeSummaryCard
        quizId="quiz-42"
        value="ANONYMOUS"
        locale="fr"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: t("fr", "participantMode.edit") }));
    fireEvent.click(
      screen.getByRole("radio", {
        name: new RegExp(escapeRegExp(t("fr", "participantMode.pseudonym.label"))),
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: t("fr", "participantMode.save") }));

    await waitFor(() => {
      expect(updateActionMock).toHaveBeenCalledWith("quiz-42", "PSEUDONYM");
    });
    expect(showToastMock).toHaveBeenCalledWith(t("fr", "participantMode.saved"), "success");
    expect(screen.queryByTestId("participant-identity-mode-dialog")).not.toBeInTheDocument();
    expect(screen.getByText(t("fr", "participantMode.pseudonym.label"))).toBeInTheDocument();
  });
});
