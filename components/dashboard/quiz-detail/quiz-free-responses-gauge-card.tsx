"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import { t, type Locale } from "@/lib/i18n";
import type { QuizResponseQuotaStatus } from "@/lib/quiz/quizResponseQuotaStatus";
import { cn } from "@/lib/utils";

type QuizFreeResponsesGaugeCardProps = {
  quotaStatus: QuizResponseQuotaStatus;
  locale: Locale;
  onUnlock?: () => void;
  className?: string;
};

function getProgressPercent(completedResponses: number, freeLimit: number): number {
  if (freeLimit <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((completedResponses / freeLimit) * 100));
}

export function QuizFreeResponsesGaugeCard({
  quotaStatus,
  locale,
  onUnlock,
  className,
}: QuizFreeResponsesGaugeCardProps) {
  const isLimitReached = quotaStatus.label === "FREE_LIMIT_REACHED";
  const progressPercent = getProgressPercent(
    quotaStatus.completedResponses,
    quotaStatus.freeLimit,
  );
  const progressLabel = t(locale, "dashboard.quizQuota.freeResponsesUsed", {
    count: quotaStatus.completedResponses,
    limit: quotaStatus.freeLimit,
  });

  return (
    <section
      className={cn(
        "max-w-sm rounded-xl border border-border/60 bg-secondary/30 px-3 py-2.5",
        className,
      )}
      data-testid="quiz-free-responses-gauge-card"
    >
      <p className="mb-1.5 text-xs font-semibold text-foreground">
        {t(locale, "dashboard.quizQuota.gaugeTitle")}
      </p>

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1 pr-7">
          <div
            role="progressbar"
            aria-valuenow={quotaStatus.completedResponses}
            aria-valuemin={0}
            aria-valuemax={quotaStatus.freeLimit}
            aria-label={progressLabel}
            className="relative h-7 overflow-hidden rounded-full bg-muted"
            data-testid="quiz-free-responses-gauge-track"
          >
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out",
                isLimitReached
                  ? "bg-gradient-to-r from-orange-500 to-red-500"
                  : "bg-gradient-to-r from-amber-400 to-orange-500",
              )}
              style={{ width: `${Math.max(progressPercent, isLimitReached ? 100 : 0)}%` }}
              data-testid="quiz-free-responses-gauge-fill"
            />
            <span className="relative z-10 flex h-full items-center justify-center text-[11px] font-bold tabular-nums leading-none text-foreground">
              {quotaStatus.completedResponses} / {quotaStatus.freeLimit}
            </span>
          </div>

          <div
            className="pointer-events-none absolute -right-0.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center"
            aria-hidden
          >
            <Image
              src="/fire-svgrepo-com.svg"
              alt=""
              width={22}
              height={22}
              className={cn(
                "h-5 w-5 drop-shadow-sm",
                "[filter:brightness(0)_saturate(100%)_invert(47%)_sepia(98%)_saturate(2476%)_hue-rotate(1deg)_brightness(101%)_contrast(104%)]",
                isLimitReached && "scale-105",
              )}
              data-testid="quiz-free-responses-gauge-flame"
            />
          </div>
        </div>

        {onUnlock ? (
          <Button
            type="button"
            variant={isLimitReached ? "blue" : "outline"}
            size="sm"
            className="h-7 shrink-0 px-2.5 text-xs font-semibold"
            onClick={onUnlock}
            data-testid="quiz-free-responses-gauge-unlock"
          >
            {isLimitReached
              ? t(locale, "dashboard.quizQuota.unlockQuiz")
              : t(locale, "dashboard.quizQuota.unlock")}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
