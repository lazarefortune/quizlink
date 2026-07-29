"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { resolveEffectiveAutoSaveEnabled } from "@/lib/builder/resolveEffectiveAutoSaveEnabled";
import type { QuizBuilder } from "@/types/quiz-builder";

export type BuilderDraftSaveOptionsPanelProps = {
  locale: Locale;
  quiz: QuizBuilder;
  setQuiz: Dispatch<SetStateAction<QuizBuilder>>;
};

/** Autosave switch panel for use inside `SplitButtonMenu` (no trigger of its own). */
export function BuilderDraftSaveOptionsPanel({
  locale,
  quiz,
  setQuiz,
}: BuilderDraftSaveOptionsPanelProps) {
  const autoSaveEffective = resolveEffectiveAutoSaveEnabled(quiz.settings);

  return (
    <>
      <DropdownMenuLabel className="text-base font-semibold leading-snug">
        {t(locale, "builder.draftSaveOptionsMenuTitle")}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <div
        role="presentation"
        className="flex flex-col gap-2 px-2 py-2.5"
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5 cursor-default select-none">
            <p className="text-base font-medium leading-snug text-foreground wrap-break-word">
              {t(locale, "builder.automaticSavingLabel")}
            </p>
            <p className="text-sm leading-snug text-muted-foreground">
              {t(locale, "builder.automaticSavingDescription")}
            </p>
          </div>
          <Switch
            checked={autoSaveEffective}
            onCheckedChange={(checked: boolean) =>
              setQuiz((prev) => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  autoSaveEnabled: checked,
                },
              }))
            }
            className="mt-1 shrink-0"
            aria-label={t(locale, "builder.automaticSavingLabel")}
          />
        </div>
      </div>
    </>
  );
}
