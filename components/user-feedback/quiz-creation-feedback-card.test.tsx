/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QuizCreationFeedbackCard } from "./quiz-creation-feedback-card";

const submitQuizCreationReviewActionMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/quiz/quiz_1/success",
}));

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" }),
}));

vi.mock("@/lib/i18n", () => ({
  t: (_locale: string, key: string) => key,
}));

vi.mock("@/app/feedback/actions", () => ({
  submitQuizCreationReviewAction: (...args: unknown[]) =>
    submitQuizCreationReviewActionMock(...args),
}));

describe("QuizCreationFeedbackCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    submitQuizCreationReviewActionMock.mockResolvedValue({ success: true });
  });

  it("shows message field after selecting a rating", () => {
    render(<QuizCreationFeedbackCard quizId="quiz_1" questionCount={5} quizStatus="ACTIVE" />);

    expect(screen.queryByLabelText("userFeedback.creation.messageLabel")).not.toBeInTheDocument();

    const starButtons = screen.getAllByRole("radio");
    fireEvent.click(starButtons[4]);

    expect(screen.getByLabelText("userFeedback.creation.messageLabel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "userFeedback.creation.submit" })).toBeInTheDocument();
  });

  it("submits rating without message and shows success state", async () => {
    render(<QuizCreationFeedbackCard quizId="quiz_1" questionCount={5} quizStatus="ACTIVE" />);

    fireEvent.click(screen.getAllByRole("radio")[2]);
    fireEvent.click(screen.getByRole("button", { name: "userFeedback.creation.submit" }));

    await waitFor(() => {
      expect(submitQuizCreationReviewActionMock).toHaveBeenCalledWith(
        {
          rating: 3,
          message: undefined,
          quizId: "quiz_1",
          page: "/dashboard/quiz/quiz_1/success",
          userAgent: expect.any(String),
        },
        { questionCount: 5, quizStatus: "ACTIVE" },
      );
    });

    expect(await screen.findByText("userFeedback.creation.success")).toBeInTheDocument();
  });

  it("shows error without removing the card when submission fails", async () => {
    submitQuizCreationReviewActionMock.mockResolvedValueOnce({
      success: false,
      error: "errors.rateLimitExceeded",
    });

    render(<QuizCreationFeedbackCard quizId="quiz_1" />);

    fireEvent.click(screen.getAllByRole("radio")[0]);
    fireEvent.click(screen.getByRole("button", { name: "userFeedback.creation.submit" }));

    expect(await screen.findByText("userFeedback.creation.error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "userFeedback.creation.submit" })).toBeInTheDocument();
  });
});
