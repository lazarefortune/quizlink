import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { t, type Locale } from "@/lib/i18n";

type QuizStatusBadgeProps = {
  status: QuizLifecycleStatus;
  locale: Locale;
  className?: string;
};

function statusLabelKey(status: QuizLifecycleStatus): string {
  switch (status) {
    case "DRAFT":
      return "quiz.status.draft";
    case "ARCHIVED":
      return "quiz.status.archived";
    case "ACTIVE":
    default:
      return "quiz.status.active";
  }
}

export function QuizStatusBadge({ status, locale, className }: QuizStatusBadgeProps) {
  const label = t(locale, statusLabelKey(status));
  const isDraft = status === "DRAFT";
  const isArchived = status === "ARCHIVED";

  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 font-medium",
        isDraft && "border-amber-500/50 bg-amber-500/10 text-amber-950 dark:text-amber-100",
        isArchived && "border-muted-foreground/40 bg-muted text-muted-foreground",
        !isDraft && !isArchived && "border-border text-muted-foreground",
        className,
      )}
    >
      {label}
    </Badge>
  );
}
