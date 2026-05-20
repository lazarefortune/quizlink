"use client";

import { cn } from "@/lib/utils";
import { t, type Locale } from "@/lib/i18n";
import { shouldShowBackToCurrentQuestion } from "@/lib/quiz/quizActiveTimedQuestion";
import { resolveQuizTimerInfo } from "@/lib/quiz/quizTimerState";
import { QuizQuestionCircularTimer } from "./quiz-question-circular-timer";

export type QuizQuestionFloatingTimerProps = {
  timeLeftSeconds: number | null | undefined;
  totalSeconds: number | null | undefined;
  locale?: Locale;
  viewedQuestionId?: string | null;
  activeTimedQuestionId?: string | null;
  onBackToCurrentQuestion?: () => void;
  className?: string;
};

// Floating timer for the active timed question (not necessarily the viewed one).
export function QuizQuestionFloatingTimer({
  timeLeftSeconds,
  totalSeconds,
  locale = "fr",
  viewedQuestionId,
  activeTimedQuestionId,
  onBackToCurrentQuestion,
  className,
}: QuizQuestionFloatingTimerProps) {
  const info = resolveQuizTimerInfo(timeLeftSeconds, totalSeconds);
  if (!info) return null;

  const showBackToCurrent = shouldShowBackToCurrentQuestion(
    viewedQuestionId,
    activeTimedQuestionId,
  );

  return (
    <div
      className={cn(
        "fixed right-4 z-40 rounded-2xl border border-border bg-card/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80",
        "bottom-[max(6rem,calc(env(safe-area-inset-bottom,0px)+5.5rem))] md:right-8 md:bottom-8",
        "max-w-[calc(100vw-2rem)]",
        className,
      )}
    >
      {/* Mobile : cercle + secondes, pas de doublon texte */}
      <div className="flex items-center gap-2 p-1 md:hidden">
        <QuizQuestionCircularTimer
          timeLeftSeconds={timeLeftSeconds}
          totalSeconds={totalSeconds}
          locale={locale}
          size="md"
        />
        {showBackToCurrent && onBackToCurrentQuestion ? (
          <button
            type="button"
            onClick={onBackToCurrentQuestion}
            className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-blue hover:bg-blue/10"
            aria-label={t(locale, "quiz.backToCurrentQuestion")}
          >
            {t(locale, "quiz.backToCurrentQuestionShort")}
          </button>
        ) : null}
      </div>

      {/* Desktop : libellé sans secondes, chiffre uniquement dans le cercle */}
      <div className="hidden items-center gap-3 px-3 py-2 md:flex">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="whitespace-nowrap text-sm font-semibold text-foreground">
            {t(locale, "quiz.timeLeftLabel")}
          </span>
          {showBackToCurrent && onBackToCurrentQuestion ? (
            <button
              type="button"
              onClick={onBackToCurrentQuestion}
              className="text-left text-xs font-medium text-blue hover:underline"
            >
              {t(locale, "quiz.backToCurrentQuestion")}
            </button>
          ) : null}
        </div>
        <QuizQuestionCircularTimer
          timeLeftSeconds={timeLeftSeconds}
          totalSeconds={totalSeconds}
          locale={locale}
          size="md"
        />
      </div>
    </div>
  );
}
