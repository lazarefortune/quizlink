"use client";

import Link from "next/link";
import { Clock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import {
  formatQuizExpirationDate,
  type QuizLinkExpirationStatus,
} from "@/lib/quiz/quizLinkExpirationStatus";
import { cn } from "@/lib/utils";

type QuizExpirationStatusCardProps = {
  expiration: QuizLinkExpirationStatus;
  onExtend?: () => void;
  onReactivate?: () => void;
  manageProHref?: string;
  className?: string;
};

export function QuizExpirationStatusCard({
  expiration,
  onExtend,
  onReactivate,
  manageProHref = "/account",
  className,
}: QuizExpirationStatusCardProps) {
  const { locale } = useLocale();

  const dateLabel =
    expiration.acceptingResponsesUntil != null
      ? formatQuizExpirationDate(expiration.acceptingResponsesUntil, locale)
      : "";

  const title = t(locale, expiration.titleKey);
  const description = t(locale, expiration.descriptionKey, { date: dateLabel });

  const isExpired = expiration.status === "EXPIRED";
  const showExtend = expiration.status === "ACTIVE" && onExtend != null;
  const showReactivate = isExpired && onReactivate != null;
  const showManagePro =
    expiration.status === "PRO_ACTIVE" && manageProHref.length > 0;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm sm:p-5",
        isExpired ? "border-destructive/30 bg-destructive/5" : "border-border/80",
        className,
      )}
      data-testid="quiz-expiration-status-card"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            {expiration.status === "PRO_ACTIVE" ? (
              <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            ) : (
              <Clock
                className={cn(
                  "h-4 w-4",
                  isExpired ? "text-destructive" : "text-muted-foreground",
                )}
              />
            )}
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
          {expiration.daysRemaining != null && expiration.daysRemaining > 0 ? (
            <p className="text-xs text-muted-foreground">
              {t(locale, "dashboard.quizExpiration.daysRemaining", {
                count: String(expiration.daysRemaining),
              })}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {showExtend ? (
            <Button type="button" variant="outline" size="sm" onClick={onExtend}>
              {t(locale, "dashboard.quizExpiration.extend")}
            </Button>
          ) : null}
          {showReactivate ? (
            <Button type="button" variant="blue" size="sm" onClick={onReactivate}>
              {t(locale, "dashboard.quizExpiration.reactivate")}
            </Button>
          ) : null}
          {showManagePro ? (
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={manageProHref}>
                {t(locale, "dashboard.quizExpiration.managePro")}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
