"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { BuilderDraftSaveSystemStatus } from "@/lib/builder/resolveBuilderDraftSaveSystemStatus";
import { cn } from "@/lib/utils";
import type { QuizBuilder } from "@/types/quiz-builder";
import { BuilderDraftSaveOptionsMenu } from "@/components/quiz-builder/builder-draft-save-options-menu";

export type BuilderDraftAutosaveStatusPillProps = {
  locale: Locale;
  status: BuilderDraftSaveSystemStatus;
  quiz: QuizBuilder;
  setQuiz: Dispatch<SetStateAction<QuizBuilder>>;
  isBusy: boolean;
  onRetrySave?: () => void;
  validationBadge?: ReactNode;
};

function statusLabelKey(status: BuilderDraftSaveSystemStatus): string | null {
  switch (status) {
    case "draft_saved":
      return "builder.saveStatus.draftSaved";
    case "saving":
      return "builder.saveStatus.saving";
    case "pending":
      return "builder.saveStatus.unsavedChanges";
    case "changes_to_save":
      return "builder.saveStatus.changesToSave";
    case "error":
      return "builder.saveStatus.saveError";
    case "hidden":
      return null;
  }
}

export function BuilderDraftAutosaveStatusPill({
  locale,
  status,
  quiz,
  setQuiz,
  isBusy,
  onRetrySave,
  validationBadge,
}: BuilderDraftAutosaveStatusPillProps) {
  if (status === "hidden") {
    return (
      <div className="flex items-center gap-1">
        <BuilderDraftSaveOptionsMenu
          locale={locale}
          quiz={quiz}
          setQuiz={setQuiz}
          isBusy={isBusy}
        />
      </div>
    );
  }

  const labelKey = statusLabelKey(status);
  if (labelKey === null) {
    return null;
  }

  const isError = status === "error";
  const isSaving = status === "saving";
  const isSaved = status === "draft_saved";

  const pillContent = (
    <>
      {isSaving ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
      ) : isError ? (
        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden />
      ) : isSaved ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
      ) : (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
      )}
      <span className="truncate">{t(locale, labelKey)}</span>
      {validationBadge}
    </>
  );

  return (
    <div className="flex items-center gap-1">
      {isError && onRetrySave ? (
        <button
          type="button"
          onClick={onRetrySave}
          disabled={isBusy}
          aria-live="polite"
          className={cn(
            "relative inline-flex max-w-[12rem] items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium",
            "border-destructive/30 bg-destructive/5 text-destructive transition-colors hover:bg-destructive/10",
            isBusy ? "cursor-not-allowed opacity-70" : "cursor-pointer",
          )}
        >
          {pillContent}
        </button>
      ) : (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "relative inline-flex max-w-[12rem] items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium",
            isSaved
              ? "border-emerald-200/80 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
              : isSaving
                ? "border-border/70 bg-muted/30 text-muted-foreground"
                : "border-border/70 bg-muted/20 text-foreground/80",
          )}
        >
          {pillContent}
        </div>
      )}
      <BuilderDraftSaveOptionsMenu
        locale={locale}
        quiz={quiz}
        setQuiz={setQuiz}
        isBusy={isBusy}
      />
    </div>
  );
}
