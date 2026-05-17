"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BuilderQuizTitleInput } from "@/components/quiz-builder/builder-quiz-title-input";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

export type BuilderMobileQuizCardProps = {
  locale: Locale;
  quizName: string;
  onQuizNameChange: (next: string) => void;
  getNameError: () => string | null;
  editorialStatus: QuizLifecycleStatus | null;
  backHref: string;
  backLinkText: string;
  onBackLinkClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  onOpenSettings: () => void;
  /** Quiz menu (⋮), share, etc. — shown next to the settings button. */
  trailingActions?: ReactNode;
};

export function BuilderMobileQuizCard({
  locale,
  quizName,
  onQuizNameChange,
  getNameError,
  editorialStatus,
  backHref,
  backLinkText,
  onBackLinkClick,
  onOpenSettings,
  trailingActions = null,
}: BuilderMobileQuizCardProps) {
  return (
    <div className="space-y-3 mb-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={backHref}
          onClick={onBackLinkClick}
          className={cn(
            "inline-flex min-w-0 items-center text-sm font-medium text-muted-foreground",
            "transition-colors hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          {backLinkText}
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label={t(locale, "builder.quizSettingsIconAriaLabel")}
            title={t(locale, "builder.quizSettingsIconAriaLabel")}
            onClick={onOpenSettings}
          >
            <Settings className="h-4 w-4" />
          </Button>
          {trailingActions}
        </div>
      </div>

      <BuilderQuizTitleInput
        variant="field"
        labelText={t(locale, "builder.quizNameCardLabel")}
        value={quizName}
        onChange={onQuizNameChange}
        placeholder={t(locale, "builder.quizNameInputPlaceholder")}
        getNameError={getNameError}
      />
    </div>
  );
}
