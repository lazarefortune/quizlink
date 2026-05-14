/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QuizCreationSuccessContent } from "./quiz-creation-success-content";

const pushMock = vi.fn();
const createOrGetQuizLinkMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/app/quiz-link/actions", () => ({
  createOrGetQuizLink: (...args: unknown[]) => createOrGetQuizLinkMock(...args),
}));

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" }),
}));

vi.mock("@/lib/i18n", () => ({
  t: (_locale: string, key: string) => key,
}));

describe("QuizCreationSuccessContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.open = vi.fn();
    Object.assign(window.navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("loads and displays share link for created quiz", async () => {
    createOrGetQuizLinkMock.mockResolvedValueOnce({
      success: true,
      quizLink: { id: "link_1", token: "token_123" },
      isFirstInviteForQuiz: true,
    });

    render(<QuizCreationSuccessContent quizId="quiz_1" quizName="Mon quiz" />);

    expect(createOrGetQuizLinkMock).toHaveBeenCalledWith("quiz_1", true);

    await waitFor(() => {
      expect(screen.getByDisplayValue("http://localhost:3000/quiz/token_123")).toBeInTheDocument();
    });
  });

  it("renders all expected actions and handles interactions", async () => {
    createOrGetQuizLinkMock.mockResolvedValueOnce({
      success: true,
      quizLink: { id: "link_1", token: "token_abc" },
      isFirstInviteForQuiz: false,
    });

    render(<QuizCreationSuccessContent quizId="quiz_42" quizName="Quiz final" />);

    const copyButton = await screen.findByRole("button", { name: "dashboard.copy" });
    const testQuizButton = screen.getByRole("button", { name: "dashboard.playQuiz" });
    const editQuizButton = screen.getByRole("button", { name: "dashboard.editQuiz" });
    const myQuizzesButton = screen.getByRole("button", { name: "dashboard.seeMyQuizzes" });

    expect(copyButton).toBeInTheDocument();
    expect(testQuizButton).toBeInTheDocument();
    expect(editQuizButton).toBeInTheDocument();
    expect(myQuizzesButton).toBeInTheDocument();

    fireEvent.click(copyButton);
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("http://localhost:3000/quiz/token_abc");
    });

    fireEvent.click(testQuizButton);
    expect(window.open).toHaveBeenCalledWith(
      "http://localhost:3000/quiz/token_abc",
      "_blank",
      "noopener,noreferrer"
    );

    fireEvent.click(editQuizButton);
    expect(pushMock).toHaveBeenCalledWith("/builder/quiz_42");

    fireEvent.click(myQuizzesButton);
    expect(pushMock).toHaveBeenCalledWith("/dashboard/quizzes");
  });

  it("shows an error and keeps test/copy disabled when link creation fails", async () => {
    createOrGetQuizLinkMock.mockResolvedValueOnce({
      success: false,
      error: "failed_to_create_link",
    });

    render(<QuizCreationSuccessContent quizId="quiz_error" quizName="Quiz erreur" />);

    expect(await screen.findByText("failed_to_create_link")).toBeInTheDocument();

    const copyButton = screen.getByRole("button", { name: "dashboard.copy" });
    const testQuizButton = screen.getByRole("button", { name: "dashboard.playQuiz" });

    expect(copyButton).toBeDisabled();
    expect(testQuizButton).toBeDisabled();
  });
});
