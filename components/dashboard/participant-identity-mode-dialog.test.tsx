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

import { ParticipantIdentityModeDialog } from "./participant-identity-mode-dialog";

describe("ParticipantIdentityModeDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateActionMock.mockResolvedValue({
      success: true,
      participantIdentityMode: "NAME_EMAIL",
    });
  });

  it("renders three collection modes when open", () => {
    render(
      <ParticipantIdentityModeDialog
        quizId="quiz-1"
        value="ANONYMOUS"
        locale="fr"
        open
        onOpenChange={() => undefined}
      />,
    );

    expect(
      screen.getByRole("heading", { name: t("fr", "participantMode.chooseTitle") }),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("participant-identity-mode-future-hint"),
    ).toHaveTextContent(t("fr", "participantMode.appliesToFutureAttempts"));
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

  it("calls update action only on save", async () => {
    const onOpenChange = vi.fn();

    render(
      <ParticipantIdentityModeDialog
        quizId="quiz-7"
        value="ANONYMOUS"
        locale="fr"
        open
        onOpenChange={onOpenChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("radio", {
        name: new RegExp(escapeRegExp(t("fr", "participantMode.nameEmail.label"))),
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: t("fr", "participantMode.save") }));

    await waitFor(() => {
      expect(updateActionMock).toHaveBeenCalledWith("quiz-7", "NAME_EMAIL");
    });
    expect(showToastMock).toHaveBeenCalledWith(t("fr", "participantMode.saved"), "success");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not save when cancel is clicked", () => {
    const onOpenChange = vi.fn();

    render(
      <ParticipantIdentityModeDialog
        quizId="quiz-1"
        value="ANONYMOUS"
        locale="fr"
        open
        onOpenChange={onOpenChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("radio", {
        name: new RegExp(escapeRegExp(t("fr", "participantMode.pseudonym.label"))),
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: t("fr", "participantMode.cancel") }));

    expect(updateActionMock).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
