/* @vitest-environment jsdom */

import type { ComponentPropsWithoutRef } from "react";

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BuilderDraftSaveSplitButton } from "@/components/quiz-builder/builder-draft-save-split-button";
import { DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS } from "@/lib/builder/defaultManualQuizSettings";
import type { QuizBuilder } from "@/types/quiz-builder";

vi.mock("@/components/ui/dropdown-menu", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/components/ui/dropdown-menu")>();
  const { DropdownMenu: DropdownMenuRoot } = mod;
  return {
    ...mod,
    DropdownMenu: (props: ComponentPropsWithoutRef<typeof DropdownMenuRoot>) => (
      <DropdownMenuRoot defaultOpen {...props} />
    ),
  };
});

vi.mock("@/lib/i18n", () => ({
  t: (_locale: string, key: string) => key,
}));

const baseQuiz = (overrides: Partial<QuizBuilder> = {}): QuizBuilder => ({
  id: "clquiz",
  name: "T",
  visibility: "PRIVATE",
  settings: { ...DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS },
  questions: [],
  createdBy: "USER",
  createdAt: new Date().toISOString(),
  ...overrides,
});

const hidden = { hidden: true } as const;

describe("BuilderDraftSaveSplitButton", () => {
  it("updates autoSaveEnabled when the menu switch is toggled", () => {
    const setQuiz = vi.fn();
    const quiz = baseQuiz({ settings: { ...DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS, autoSaveEnabled: true } });

    render(
      <BuilderDraftSaveSplitButton
        locale="en"
        quiz={quiz}
        setQuiz={setQuiz}
        onPrimarySaveClick={vi.fn()}
        primaryDisabled={false}
        isBusy={false}
        showPrimarySpinner={false}
        autosaveQueued={false}
        savedClean={false}
        validationBadge={null}
        isDestructiveStyled={false}
      />,
    );

    fireEvent.click(screen.getByRole("switch", { name: /builder\.automaticSavingLabel/i }));

    expect(setQuiz).toHaveBeenCalledTimes(1);
    const updater = setQuiz.mock.calls[0][0] as (prev: QuizBuilder) => QuizBuilder;
    const next = updater(quiz);
    expect(next.settings.autoSaveEnabled).toBe(false);
  });

  it("shows awaiting-autosave label on the primary when queued and idle", () => {
    render(
      <BuilderDraftSaveSplitButton
        locale="en"
        quiz={baseQuiz()}
        setQuiz={vi.fn()}
        onPrimarySaveClick={vi.fn()}
        primaryDisabled={false}
        isBusy={false}
        showPrimarySpinner={false}
        autosaveQueued={true}
        savedClean={false}
        validationBadge={null}
        isDestructiveStyled={false}
      />,
    );

    expect(
      screen.getByRole("button", { name: /builder\.draftSavePrimaryAwaitingAutosave/i, ...hidden }),
    ).toBeInTheDocument();
  });

  it("shows saved label and check icon when clean and idle", () => {
    render(
      <BuilderDraftSaveSplitButton
        locale="en"
        quiz={baseQuiz()}
        setQuiz={vi.fn()}
        onPrimarySaveClick={vi.fn()}
        primaryDisabled
        isBusy={false}
        showPrimarySpinner={false}
        autosaveQueued={false}
        savedClean
        validationBadge={null}
        isDestructiveStyled={false}
      />,
    );

    expect(
      screen.getByRole("button", { name: /builder\.saveStatus\.draftSavedShort/i, ...hidden }),
    ).toBeInTheDocument();
  });

  it("keeps the options menu enabled when primary is disabled because draft is saved clean", () => {
    const { container } = render(
      <BuilderDraftSaveSplitButton
        locale="en"
        quiz={baseQuiz({ settings: { ...DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS, autoSaveEnabled: true } })}
        setQuiz={vi.fn()}
        onPrimarySaveClick={vi.fn()}
        primaryDisabled
        isBusy={false}
        showPrimarySpinner={false}
        autosaveQueued={false}
        savedClean
        validationBadge={null}
        isDestructiveStyled={false}
      />,
    );

    const menuTrigger = container.querySelector('[data-slot="split-button-menu"]');
    expect(menuTrigger).not.toBeDisabled();
    expect(screen.getByRole("switch", { name: /builder\.automaticSavingLabel/i })).toBeInTheDocument();
  });

  it("centers primary segment content when centerPrimaryContent is true", () => {
    const { container } = render(
      <BuilderDraftSaveSplitButton
        locale="en"
        quiz={baseQuiz()}
        setQuiz={vi.fn()}
        onPrimarySaveClick={vi.fn()}
        primaryDisabled={false}
        isBusy={false}
        showPrimarySpinner={false}
        autosaveQueued={false}
        savedClean={false}
        validationBadge={null}
        isDestructiveStyled={false}
        centerPrimaryContent
      />,
    );

    const primaryButton = container.querySelector('[data-slot="split-button-action"]');
    expect(primaryButton?.className).toContain("justify-center");
    expect(primaryButton?.className).toContain("text-center");
  });
});
