"use client";

import { AlertCircle } from "lucide-react";
import { Settings05Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { BuilderQuestionNavigator } from "@/components/quiz-builder/builder-question-navigator";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/quiz-builder";

type BuilderDesktopSidebarProps = {
  locale: Locale;
  isSettingsSelected: boolean;
  settingsHasError: boolean;
  onSettingsClick: () => void;
  questions: Question[];
  activeQuestionId: string | null;
  onQuestionClick: (questionId: string) => void;
  onAddQuestion: () => void;
  onReorder: (nextQuestions: Question[]) => void;
  questionErrorIds?: ReadonlySet<string>;
};

export function BuilderDesktopSidebar({
  locale,
  isSettingsSelected,
  settingsHasError,
  onSettingsClick,
  questions,
  activeQuestionId,
  onQuestionClick,
  onAddQuestion,
  onReorder,
  questionErrorIds,
}: BuilderDesktopSidebarProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border/60 p-3">
        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t(locale, "builder.sidebarQuizInfoLabel")}
        </p>
        <button
          type="button"
          onClick={onSettingsClick}
          aria-current={isSettingsSelected ? "page" : undefined}
          className={cn(
            "flex w-full items-center gap-2 rounded-xs border px-3 py-2.5 text-left text-sm font-medium transition-colors",
            isSettingsSelected
              ? "border-blue/50 bg-blue/10 text-foreground shadow-sm"
              : "border-border/50 bg-card/80 text-foreground hover:border-border hover:bg-muted/40",
            settingsHasError &&
              !isSettingsSelected &&
              "border-destructive/45 bg-destructive/[0.06] hover:border-destructive/55",
          )}
        >
          <HugeiconsIcon
            icon={Settings05Icon}
            strokeWidth={2}
            className={cn(
              "h-4 w-4 shrink-0 pointer-events-none",
              isSettingsSelected ? "text-blue" : "text-muted-foreground",
            )}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate">
            {t(locale, "builder.sidebarQuizInfoSubtitle")}
          </span>
          {settingsHasError ? (
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden />
          ) : null}
        </button>
      </div>
      <BuilderQuestionNavigator
        locale={locale}
        questions={questions}
        activeQuestionId={isSettingsSelected ? null : activeQuestionId}
        onQuestionClick={onQuestionClick}
        onAddQuestion={onAddQuestion}
        onReorder={onReorder}
        questionErrorIds={questionErrorIds}
        showDesktopEmptyState
      />
    </div>
  );
}
