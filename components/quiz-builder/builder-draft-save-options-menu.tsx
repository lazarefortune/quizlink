"use client";

import type { Dispatch, SetStateAction } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { resolveEffectiveAutoSaveEnabled } from "@/lib/builder/resolveEffectiveAutoSaveEnabled";
import { cn } from "@/lib/utils";
import type { QuizBuilder } from "@/types/quiz-builder";

export type BuilderDraftSaveOptionsMenuProps = {
  locale: Locale;
  quiz: QuizBuilder;
  setQuiz: Dispatch<SetStateAction<QuizBuilder>>;
  isBusy: boolean;
  triggerClassName?: string;
  align?: "start" | "center" | "end";
};

export function BuilderDraftSaveOptionsMenu({
  locale,
  quiz,
  setQuiz,
  isBusy,
  triggerClassName,
  align = "end",
}: BuilderDraftSaveOptionsMenuProps) {
  const autoSaveEffective = resolveEffectiveAutoSaveEnabled(quiz.settings);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isBusy}
          aria-label={t(locale, "builder.draftSaveOptionsMenuAriaLabel")}
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-card text-foreground transition-colors",
            "hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isBusy ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            triggerClassName,
          )}
        >
          <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="max-w-[min(100vw-2rem,20rem)]" sideOffset={6}>
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
