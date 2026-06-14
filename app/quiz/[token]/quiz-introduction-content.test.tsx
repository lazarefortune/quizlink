/* @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" as const }),
}));

vi.mock("@/app/quiz-link/anonymous-quiz-stats-actions", () => ({
  recordAnonymousLinkOpen: vi.fn(),
}));

vi.mock("@/app/quiz-link/anonymous-attempt-actions", () => ({
  startAnonymousQuizAttemptAction: vi.fn(),
}));

vi.mock("@/app/quiz-link/actions", () => ({
  startQuizAttempt: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { t } from "@/lib/i18n";

import { QuizIntroductionContent } from "./quiz-introduction-content";

const baseQuizLink = {
  id: "link-1",
  quizId: "quiz-1",
  token: "token-1",
  participantId: null,
  participant: null,
  allowMultipleAttempts: true,
  expiresAt: null,
  isAcceptingResponses: false,
  hasCompletedAttempt: false,
  quiz: {
    id: "quiz-1",
    name: "Quiz quota",
    visibility: "PUBLIC",
    ownerId: "owner-1",
    settings: {},
    questions: [{ id: "q1", type: "MULTIPLE_CHOICE", label: "Q1", image: null, order: 1, options: [] }],
  },
};

describe("QuizIntroductionContent free limit reached", () => {
  it("does not show start button when free quota is reached", () => {
    render(
      <QuizIntroductionContent
        quizLink={baseQuizLink}
        token="token-1"
        isLinkExpired
        isOwner={false}
      />,
    );

    expect(screen.getByTestId("quiz-limit-reached-intro")).toBeTruthy();
    expect(screen.getByText(t("fr", "quiz.limitReached.title"))).toBeTruthy();
    expect(screen.getByText(t("fr", "quiz.limitReached.description"))).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Commencer le quiz" })).toBeNull();
  });

  it("shows creator dashboard CTA for owner", () => {
    render(
      <QuizIntroductionContent
        quizLink={baseQuizLink}
        token="token-1"
        isLinkExpired
        isOwner
      />,
    );

    expect(screen.getByText(t("fr", "quiz.limitReached.creatorCta"))).toBeTruthy();
  });
});
