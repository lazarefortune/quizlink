"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { CheckCircle2, ChevronDown, Loader2, Save } from "lucide-react";

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

/**
 * Outline split control: outer shell carries the raised shadow (`--shadow-raised`, matching `.btn-bouncy`).
 * Inner segments stay shadow-free — `Button` applies `disabled:shadow-none`, which flattened only half of the split.
 */
const splitShellInteract = cn(
  "isolate flex min-h-11 min-w-0 w-full items-stretch gap-0 overflow-hidden rounded-2xl border-2 bg-card",
  "text-foreground shadow-[var(--shadow-raised)] ring-offset-background transition-all duration-100 ease-out",
  "hover:brightness-105 dark:hover:brightness-105",
  "has-[button:active]:translate-y-1 has-[button:active]:shadow-none",
);

const segmentTypo =
  "inline-flex min-h-11 items-center justify-center gap-2 text-base font-semibold uppercase tracking-wide";

const segmentFocus =
  [
    "select-none rounded-none border-0 bg-transparent shadow-none outline-none transition-[background-color,opacity,color,filter]",
    "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
  ].join(" ");

export type BuilderDraftSaveSplitButtonProps = {
  locale: Locale;
  quiz: QuizBuilder;
  setQuiz: Dispatch<SetStateAction<QuizBuilder>>;
  onPrimarySaveClick: () => void;
  primaryDisabled: boolean;
  isBusy: boolean;
  /** True while saving manually or autosave in flight — shows spinner label. */
  showPrimarySpinner: boolean;
  /** True when autosave debounce scheduled (dirty + autosave gate open) — short “pending” caption. */
  autosaveQueued: boolean;
  /** True when server draft matches baseline (nothing to save) and not in an error-retry state. */
  savedClean: boolean;
  validationBadge: ReactNode;
  isDestructiveStyled: boolean;
  /** Centers icon + label in the primary segment (mobile). Chevron zone unchanged. */
  centerPrimaryContent?: boolean;
};

export function BuilderDraftSaveSplitButton({
  locale,
  quiz,
  setQuiz,
  onPrimarySaveClick,
  primaryDisabled,
  isBusy,
  showPrimarySpinner,
  autosaveQueued,
  savedClean,
  validationBadge,
  isDestructiveStyled,
  centerPrimaryContent = false,
}: BuilderDraftSaveSplitButtonProps) {
  const iconClass = "pointer-events-none h-4 w-4 shrink-0";

  const autoSaveEffective = resolveEffectiveAutoSaveEnabled(quiz.settings);

  const savedLabel =
    savedClean && !showPrimarySpinner
      ? t(locale, "builder.saveStatus.draftSavedShort")
      : null;

  const pendingLabel =
    autosaveQueued && !showPrimarySpinner
      ? t(locale, "builder.draftSavePrimaryAwaitingAutosave")
      : null;

  const primaryLabel = showPrimarySpinner
    ? t(locale, "builder.saveStatus.saving")
    : (savedLabel ?? pendingLabel ?? t(locale, "builder.save"));

  const destructiveSegments = isDestructiveStyled
    ? "text-destructive hover:bg-destructive/[0.12] hover:text-destructive"
    : "text-foreground hover:bg-secondary";

  return (
    <div
      className={cn(
        splitShellInteract,
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        isDestructiveStyled
          ? "border-destructive/55 shadow-black/[0.06] ring-1 ring-destructive/20 dark:border-destructive/50 dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.72)] dark:shadow-black/55"
          : "border-border",
      )}
    >
        <button
          type="button"
          onClick={onPrimarySaveClick}
          disabled={primaryDisabled}
          aria-busy={isBusy || undefined}
          aria-live="polite"
          title={pendingLabel ?? undefined}
          className={cn(
            segmentTypo,
            segmentFocus,
            destructiveSegments,
            "relative min-w-0 flex-1 border-r border-border/90",
            centerPrimaryContent
              ? "justify-center px-3 text-center"
              : "justify-start px-3 pr-5 text-left",
            showPrimarySpinner
              ? "cursor-default opacity-100"
              : primaryDisabled && savedLabel !== null
                ? "cursor-not-allowed opacity-100 text-emerald-700 dark:text-emerald-400 hover:bg-transparent hover:text-emerald-700 dark:hover:text-emerald-400"
                : primaryDisabled
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer opacity-100",
            pendingLabel !== null &&
              savedLabel === null &&
              !primaryDisabled &&
              !showPrimarySpinner
              ? "text-muted-foreground hover:bg-secondary/85 hover:text-muted-foreground"
              : null,
          )}
        >
          {showPrimarySpinner ? (
            <Loader2 strokeWidth={2} className={cn(iconClass, "animate-spin text-muted-foreground")} aria-hidden />
          ) : savedLabel !== null ? (
            <CheckCircle2 strokeWidth={2} className={cn(iconClass, "text-emerald-600 dark:text-emerald-400")} aria-hidden />
          ) : pendingLabel !== null ? (
            <Loader2 strokeWidth={2} className={cn(iconClass, "animate-spin text-muted-foreground")} aria-hidden />
          ) : (
            <Save strokeWidth={2} className={iconClass} aria-hidden />
          )}
          <span
            className={cn(
              "min-w-0 truncate",
              centerPrimaryContent ? "text-center" : "flex-1 text-left",
            )}
          >
            {primaryLabel}
          </span>
          {validationBadge}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={isBusy}
              aria-label={t(locale, "builder.draftSaveOptionsMenuAriaLabel")}
              className={cn(
                segmentTypo,
                segmentFocus,
                destructiveSegments,
                "w-11 min-w-[2.75rem] shrink-0 cursor-pointer px-0",
                isBusy ? "cursor-not-allowed opacity-50" : "opacity-100",
              )}
            >
              <ChevronDown className={cn(iconClass, "transition-none")} aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-w-[min(100vw-2rem,20rem)]" sideOffset={6}>
            <DropdownMenuLabel className="text-base uppercase font-semibold leading-snug">
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
    </div>
  );
}
