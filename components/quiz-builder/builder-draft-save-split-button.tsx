"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CloudSavingDone01Icon, LoaderCircle, SaveIcon } from "@hugeicons/core-free-icons";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { QuizBuilder } from "@/types/quiz-builder";
import {
  SplitButton,
  SplitButtonAction,
  SplitButtonMenu,
  type SplitButtonSize,
} from "@/components/ui/split-button";
import { BuilderDraftSaveOptionsPanel } from "@/components/quiz-builder/builder-draft-save-options-panel";

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
  size?: SplitButtonSize;
  className?: string;
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
  size = "default",
  className,
}: BuilderDraftSaveSplitButtonProps) {
  const iconClass = "pointer-events-none shrink-0";

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

  return (
    <SplitButton
      variant={isDestructiveStyled ? "destructive" : "outline"}
      size={size}
      disabled={isBusy}
      menuAriaLabel={t(locale, "builder.draftSaveOptionsMenuAriaLabel")}
      className={cn(
        "min-w-0",
        centerPrimaryContent && "w-full",
        // Keep menu readable when only the primary action is disabled (saved clean).
        primaryDisabled && !isBusy && "has-[button:disabled]:opacity-100",
        className,
      )}
    >
      <SplitButtonAction
        onClick={onPrimarySaveClick}
        disabled={primaryDisabled}
        isLoading={showPrimarySpinner}
        aria-live="polite"
        title={pendingLabel ?? undefined}
        className={cn(
          "relative",
          centerPrimaryContent ? "justify-center text-center" : "justify-start text-left",
          !showPrimarySpinner &&
            primaryDisabled &&
            savedLabel !== null &&
            "opacity-100 text-emerald-700 dark:text-emerald-400 hover:bg-transparent hover:text-emerald-700 dark:hover:text-emerald-400",
          !showPrimarySpinner &&
            pendingLabel !== null &&
            savedLabel === null &&
            !primaryDisabled &&
            "text-muted-foreground hover:bg-secondary/85 hover:text-muted-foreground",
        )}
      >
        {!showPrimarySpinner && savedLabel !== null ? (
          <HugeiconsIcon icon={CloudSavingDone01Icon} strokeWidth={2.2} className={iconClass} aria-hidden />
        ) : null}
        {!showPrimarySpinner && pendingLabel !== null && savedLabel === null ? (
          <HugeiconsIcon
            icon={LoaderCircle}
            strokeWidth={2.2}
            className={cn(iconClass, "animate-spin text-muted-foreground")}
            aria-hidden
          />
        ) : null}
        {!showPrimarySpinner && savedLabel === null && pendingLabel === null ? (
          <HugeiconsIcon icon={SaveIcon} strokeWidth={2.2} className={iconClass} aria-hidden />
        ) : null}
        <span
          className={cn(
            "min-w-0 truncate",
            centerPrimaryContent ? "text-center" : "flex-1 text-left",
          )}
        >
          {primaryLabel}
        </span>
        {validationBadge}
      </SplitButtonAction>
      <SplitButtonMenu contentClassName="max-w-[min(100vw-2rem,20rem)]">
        <BuilderDraftSaveOptionsPanel locale={locale} quiz={quiz} setQuiz={setQuiz} />
      </SplitButtonMenu>
    </SplitButton>
  );
}
