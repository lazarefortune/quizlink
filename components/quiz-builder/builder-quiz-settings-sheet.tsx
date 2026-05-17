"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
} from "@/components/ui/sheet";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { BuilderTimeLimitUi } from "@/lib/time-limit-seconds";
import type { ValidationError } from "@/lib/quiz-validation";
import type { QuizBuilder } from "@/types/quiz-builder";
import { BuilderQuizOptionsFields } from "@/components/quiz-builder/builder-quiz-options-fields";

export type BuilderQuizSettingsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
  quiz: QuizBuilder;
  setQuiz: Dispatch<SetStateAction<QuizBuilder>>;
  timeLimitUi: BuilderTimeLimitUi;
  setTimeLimitUi: Dispatch<SetStateAction<BuilderTimeLimitUi>>;
  getTimeLimitError: () => string | null;
  getNameError: () => string | null;
  setValidationErrors: Dispatch<SetStateAction<ValidationError[]>>;
  /** When false, the quiz name is edited inline in the builder header (desktop). */
  showNameField: boolean;
};

/**
 * Quiz settings in a sheet: desktop = right drawer (wider on lg), narrow screens = full-width from the right.
 */
export function BuilderQuizSettingsSheet({
  open,
  onOpenChange,
  locale,
  quiz,
  setQuiz,
  timeLimitUi,
  setTimeLimitUi,
  getTimeLimitError,
  getNameError,
  setValidationErrors,
  showNameField,
}: BuilderQuizSettingsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className={cn(
          "flex flex-col gap-0 overflow-hidden p-0",
          "w-full max-w-none sm:max-w-md lg:max-w-lg",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <SheetHeader className="shrink-0 space-y-2 border-b border-border/60 px-4 pb-4 pt-14 text-left">
            <h2 className="text-xl font-bold leading-tight tracking-tight text-foreground">
              {t(locale, "builder.settingsSheetTitle")}
            </h2>
            <SheetDescription className="text-sm leading-snug text-muted-foreground">
              {t(locale, "builder.settingsSheetDescription")}
            </SheetDescription>
          </SheetHeader>
          <div className="builder-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-8 pt-4">
            <BuilderQuizOptionsFields
              quiz={quiz}
              setQuiz={setQuiz}
              timeLimitUi={timeLimitUi}
              setTimeLimitUi={setTimeLimitUi}
              locale={locale}
              getTimeLimitError={getTimeLimitError}
              setValidationErrors={setValidationErrors}
              showNameField={showNameField}
              getNameError={getNameError}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
