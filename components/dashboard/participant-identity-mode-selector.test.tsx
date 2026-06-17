/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { t } from "@/lib/i18n";

import { escapeRegExp } from "./participant-identity-mode-test-helpers";

import { ParticipantIdentityModeSelector } from "./participant-identity-mode-selector";

const updateActionMock = vi.fn();
const showToastMock = vi.fn();

vi.mock("@/app/(app)/dashboard/quiz/[quizId]/actions", () => ({
  updateQuizParticipantIdentityModeAction: (...args: unknown[]) => updateActionMock(...args),
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

describe("ParticipantIdentityModeSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateActionMock.mockResolvedValue({
      success: true,
      participantIdentityMode: "PSEUDONYM",
    });
  });

  it("renders three mode options", () => {
    render(
      <ParticipantIdentityModeSelector
        quizId="quiz-1"
        value="ANONYMOUS"
        locale="fr"
      />,
    );

    expect(
      screen.getByRole("radio", {
        name: new RegExp(escapeRegExp(t("fr", "participantMode.anonymous.label"))),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", {
        name: new RegExp(escapeRegExp(t("fr", "participantMode.pseudonym.label"))),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", {
        name: new RegExp(escapeRegExp(t("fr", "participantMode.nameEmail.label"))),
      }),
    ).toBeInTheDocument();
  });

  it("calls update action when selecting a different mode", async () => {
    render(
      <ParticipantIdentityModeSelector
        quizId="quiz-42"
        value="ANONYMOUS"
        locale="fr"
      />,
    );

    fireEvent.click(
      screen.getByRole("radio", {
        name: new RegExp(escapeRegExp(t("fr", "participantMode.pseudonym.label"))),
      }),
    );

    await waitFor(() => {
      expect(updateActionMock).toHaveBeenCalledWith("quiz-42", "PSEUDONYM");
    });
    expect(showToastMock).toHaveBeenCalledWith(t("fr", "participantMode.saved"), "success");
  });

  it("shows existing responses hint when applicable", () => {
    render(
      <ParticipantIdentityModeSelector
        quizId="quiz-1"
        value="ANONYMOUS"
        locale="fr"
        hasExistingResponses
      />,
    );

    expect(
      screen.getByTestId("participant-identity-mode-future-hint"),
    ).toHaveTextContent(t("fr", "participantMode.existingAttemptsKeepMode"));
  });
});
