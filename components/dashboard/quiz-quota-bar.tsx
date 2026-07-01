"use client";

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { t, type Locale } from "@/lib/i18n";
import type { QuizResponseQuotaStatus } from "@/lib/quiz/quizResponseQuotaStatus";
import { cn } from "@/lib/utils";

const FLAME_ICON_FILTER =
  "[filter:brightness(0)_saturate(100%)_invert(47%)_sepia(98%)_saturate(2476%)_hue-rotate(1deg)_brightness(101%)_contrast(104%)]";

type QuizQuotaBarProps = {
  quotaStatus: QuizResponseQuotaStatus;
  locale: Locale;
  className?: string;
  unlockHref?: string;
};

function getProgressPercent(completedResponses: number, freeLimit: number): number {
  if (freeLimit <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((completedResponses / freeLimit) * 100));
}

function isFreeQuotaLabel(label: QuizResponseQuotaStatus["label"]): boolean {
  return label === "FREE_AVAILABLE" || label === "FREE_LIMIT_REACHED";
}

function getBarLabel(quotaStatus: QuizResponseQuotaStatus, locale: Locale): string {
  switch (quotaStatus.label) {
    case "PRO_ACTIVE":
      return t(locale, "dashboard.quizQuota.pro");
    case "UNLOCKED":
      return t(locale, "dashboard.quizQuota.unlocked");
    case "FREE_LIMIT_REACHED":
    case "FREE_AVAILABLE":
      return `${quotaStatus.completedResponses} / ${quotaStatus.freeLimit}`;
    default:
      return "";
  }
}

export function QuizQuotaBar({
  quotaStatus,
  locale,
  className,
  unlockHref,
}: QuizQuotaBarProps) {
  const isFreeQuota = isFreeQuotaLabel(quotaStatus.label);
  const isLimitReached = quotaStatus.label === "FREE_LIMIT_REACHED";
  const progressPercent = getProgressPercent(
    quotaStatus.completedResponses,
    quotaStatus.freeLimit,
  );
  const barLabel = getBarLabel(quotaStatus, locale);
  const progressAriaLabel = isFreeQuota
    ? t(locale, "dashboard.quizQuota.freeResponsesUsed", {
        count: quotaStatus.completedResponses,
        limit: quotaStatus.freeLimit,
      })
    : barLabel;
  const showUnlockCta =
    quotaStatus.label === "FREE_LIMIT_REACHED" && unlockHref != null && unlockHref.length > 0;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="relative min-w-0">
        <div
          role="progressbar"
          aria-valuenow={isFreeQuota ? quotaStatus.completedResponses : undefined}
          aria-valuemin={isFreeQuota ? 0 : undefined}
          aria-valuemax={isFreeQuota ? quotaStatus.freeLimit : undefined}
          aria-label={progressAriaLabel}
          className="relative h-5 overflow-hidden rounded-l-full rounded-r-lg bg-muted pr-9"
          data-testid="quiz-quota-bar"
        >
          {isFreeQuota && (progressPercent > 0 || isLimitReached) ? (
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-l-full transition-[width] duration-300 ease-out",
                isLimitReached
                  ? "bg-gradient-to-r from-orange-400 to-red-500"
                  : "bg-gradient-to-r from-amber-300 to-orange-400",
              )}
              style={{ width: `${isLimitReached ? 100 : progressPercent}%` }}
              data-testid="quiz-quota-bar-fill"
            />
          ) : null}
          <span className="relative z-10 flex h-full items-center justify-center text-sm font-bold tabular-nums text-muted-foreground">
            {barLabel}
          </span>
        </div>

        <div
          className="pointer-events-none absolute bg-white dark:bg-card rounded-full -right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center"
          aria-hidden
        >
          <Image
            src="/fire-svgrepo-com.svg"
            alt=""
            width={24}
            height={24}
            className={cn(
              "h-6 w-6 drop-shadow-sm",
              FLAME_ICON_FILTER,
              isLimitReached && "scale-105",
            )}
            data-testid="quiz-quota-bar-flame"
          />
        </div>
      </div>

      {showUnlockCta ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto self-start px-0 text-destructive"
          asChild
        >
          <Link href={unlockHref}>{t(locale, "dashboard.quizQuota.unlock")}</Link>
        </Button>
      ) : null}
    </div>
  );
}
