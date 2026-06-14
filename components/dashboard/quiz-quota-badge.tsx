"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { t, type Locale } from "@/lib/i18n";
import type { QuizResponseQuotaStatus } from "@/lib/quiz/quizResponseQuotaStatus";
import { cn } from "@/lib/utils";

type QuizQuotaBadgeProps = {
  quotaStatus: QuizResponseQuotaStatus;
  locale: Locale;
  className?: string;
  unlockHref?: string;
};

function getQuotaBadgeLabel(
  quotaStatus: QuizResponseQuotaStatus,
  locale: Locale,
): string {
  switch (quotaStatus.label) {
    case "PRO_ACTIVE":
      return t(locale, "dashboard.quizQuota.pro");
    case "UNLOCKED":
      return t(locale, "dashboard.quizQuota.unlocked");
    case "FREE_LIMIT_REACHED":
      return t(locale, "dashboard.quizQuota.limitReached");
    case "FREE_AVAILABLE":
      return t(locale, "dashboard.quizQuota.freeProgress", {
        count: quotaStatus.completedResponses,
        limit: quotaStatus.freeLimit,
      });
    default:
      return "";
  }
}

export function QuizQuotaBadge({
  quotaStatus,
  locale,
  className,
  unlockHref,
}: QuizQuotaBadgeProps) {
  const label = getQuotaBadgeLabel(quotaStatus, locale);
  const showUnlockCta =
    quotaStatus.label === "FREE_LIMIT_REACHED" && unlockHref != null && unlockHref.length > 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Badge
        variant="outline"
        className={cn(
          "font-medium",
          quotaStatus.label === "FREE_LIMIT_REACHED" &&
            "border-destructive/40 bg-destructive/10 text-destructive dark:text-red-300",
          quotaStatus.label === "FREE_AVAILABLE" &&
            "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
          quotaStatus.label === "UNLOCKED" &&
            "border-primary/40 bg-primary/10 text-primary",
          quotaStatus.label === "PRO_ACTIVE" &&
            "border-violet-500/40 bg-violet-500/10 text-violet-900 dark:text-violet-100",
        )}
        data-testid="quiz-quota-badge"
      >
        {label}
      </Badge>
      {showUnlockCta ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0 text-destructive"
          asChild
        >
          <Link href={unlockHref}>{t(locale, "dashboard.quizQuota.unlock")}</Link>
        </Button>
      ) : null}
    </div>
  );
}
