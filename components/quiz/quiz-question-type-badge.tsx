import { CheckCheck, CircleCheck, ListChecks } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { t, type Locale } from "@/lib/i18n";

type QuizQuestionTypeBadgeProps = {
  type: string;
  locale: Locale;
};

/**
 * Player-facing badge that hints at the question type:
 * - MULTIPLE_CHOICE / TRUE_FALSE: neutral "Single answer" badge
 * - CHECKBOX: accented "Multiple answers" badge to draw the player's attention to the
 *   multi-select case, which is the most common source of confusion.
 */
export function QuizQuestionTypeBadge({ type, locale }: QuizQuestionTypeBadgeProps) {
  if (type === "CHECKBOX") {
    return (
      <Badge variant="outlineBlue" className="inline-flex items-center gap-1.5">
        <ListChecks className="h-3.5 w-3.5" />
        {t(locale, "quiz.selectAllCorrectAnswers")}
      </Badge>
    );
  }

  if (type === "TRUE_FALSE") {
    return (
      <Badge variant="secondary" className="inline-flex items-center gap-1.5">
        <CheckCheck className="h-3.5 w-3.5" />
        {t(locale, "quiz.selectTrueOrFalse")}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="inline-flex items-center gap-1.5">
      <CircleCheck className="h-3.5 w-3.5" />
      {t(locale, "quiz.selectCorrectAnswer")}
    </Badge>
  );
}
