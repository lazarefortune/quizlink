"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import {
  formatQuizExpirationDate,
  type QuizLinkExpirationStatus,
} from "@/lib/quiz/quizLinkExpirationStatus";
import { cn } from "@/lib/utils";

type QuizExpirationBadgeProps = {
  expiration: QuizLinkExpirationStatus;
  className?: string;
  onReactivate?: () => void;
};

export function QuizExpirationBadge({
  expiration,
  className,
  onReactivate,
}: QuizExpirationBadgeProps) {
  const { locale } = useLocale();

  const dateLabel =
    expiration.acceptingResponsesUntil != null
      ? formatQuizExpirationDate(expiration.acceptingResponsesUntil, locale)
      : null;

  const label = t(locale, expiration.listLabelKey, {
    date: dateLabel ?? "",
  });

  const isExpired = expiration.status === "EXPIRED";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Badge
        variant="outline"
        className={cn(
          "font-medium",
          isExpired &&
            "border-destructive/40 bg-destructive/10 text-destructive dark:text-red-300",
          expiration.status === "ACTIVE" &&
            "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
          expiration.status === "UNLOCKED" &&
            "border-primary/40 bg-primary/10 text-primary",
          expiration.status === "PRO_ACTIVE" &&
            "border-violet-500/40 bg-violet-500/10 text-violet-900 dark:text-violet-100",
          expiration.status === "NOT_STARTED" && "text-muted-foreground",
        )}
      >
        {label}
      </Badge>
      {isExpired && onReactivate ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0 text-destructive"
          onClick={onReactivate}
        >
          {t(locale, "dashboard.quizExpiration.reactivate")}
        </Button>
      ) : null}
    </div>
  );
}
