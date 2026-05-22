"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import { cn } from "@/lib/utils";

type QuizPreviewBannerProps = {
  quizId: string;
  className?: string;
};

export function QuizPreviewBanner({ quizId, className }: QuizPreviewBannerProps) {
  const { locale } = useLocale();

  return (
    <div
      data-testid="quiz-preview-banner"
      className={cn(
        "sticky top-0 z-30 border-b border-amber-200/80 bg-amber-50/95 backdrop-blur supports-[backdrop-filter]:bg-amber-50/90",
        "dark:border-amber-900/60 dark:bg-amber-950/40",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-none flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between md:max-w-4xl sm:px-8 sm:py-3">
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-amber-300/80 bg-amber-100/80 text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100"
            >
              {t(locale, "quiz.previewMode")}
            </Badge>
          </div>
          <p className="text-xs text-amber-950/80 dark:text-amber-100/80 sm:text-sm">
            {t(locale, "quiz.previewNotSaved")}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs sm:text-sm" asChild>
            <Link href={`/dashboard/quiz/${quizId}`}>
              {t(locale, "quiz.previewBackToQuiz")}
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs sm:text-sm" asChild>
            <Link href={`/builder/${quizId}`}>{t(locale, "quiz.previewEdit")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
