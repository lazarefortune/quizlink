/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { escapeRegExp } from "@/components/dashboard/participant-identity-mode-test-helpers";
import { DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS } from "@/lib/builder/defaultManualQuizSettings";
import { t } from "@/lib/i18n";
import type { QuizBuilder } from "@/types/quiz-builder";

import { BuilderParticipantIdentityModeSection } from "./builder-participant-identity-mode-section";

const baseQuiz = (overrides: Partial<QuizBuilder> = {}): QuizBuilder => ({
  id: "quiz-1",
  name: "Mon quiz",
  visibility: "PRIVATE",
  settings: { ...DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS },
  questions: [],
  createdBy: "USER",
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("BuilderParticipantIdentityModeSection", () => {
  it("renders the section title and three mode options", () => {
    render(
      <BuilderParticipantIdentityModeSection
        locale="fr"
        quiz={baseQuiz()}
        setQuiz={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: t("fr", "participantMode.sectionTitle"),
      }),
    ).toBeInTheDocument();
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

  it("updates quiz.settings.participantIdentityMode via setQuiz when selecting a mode", () => {
    const setQuiz = vi.fn();
    const quiz = baseQuiz({
      settings: {
        ...DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS,
        participantIdentityMode: "ANONYMOUS",
      },
    });

    render(
      <BuilderParticipantIdentityModeSection
        locale="fr"
        quiz={quiz}
        setQuiz={setQuiz}
      />,
    );

    fireEvent.click(
      screen.getByRole("radio", {
        name: new RegExp(escapeRegExp(t("fr", "participantMode.pseudonym.label"))),
      }),
    );

    expect(setQuiz).toHaveBeenCalledTimes(1);
    const updater = setQuiz.mock.calls[0][0] as (prev: QuizBuilder) => QuizBuilder;
    expect(updater(quiz).settings.participantIdentityMode).toBe("PSEUDONYM");
  });

  it("does not call setQuiz when selecting the already selected mode", () => {
    const setQuiz = vi.fn();

    render(
      <BuilderParticipantIdentityModeSection
        locale="fr"
        quiz={baseQuiz()}
        setQuiz={setQuiz}
      />,
    );

    fireEvent.click(
      screen.getByRole("radio", {
        name: new RegExp(escapeRegExp(t("fr", "participantMode.anonymous.label"))),
      }),
    );

    expect(setQuiz).not.toHaveBeenCalled();
  });
});
