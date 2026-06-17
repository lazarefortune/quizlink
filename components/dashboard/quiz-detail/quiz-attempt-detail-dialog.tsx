"use client";

import { useEffect, useState } from "react";
import { Check, Clock, X } from "lucide-react";

import {
  getAttemptDetails,
  type GetAttemptDetailsResponse,
} from "@/app/(app)/dashboard/quiz/[quizId]/actions";
import { ATTEMPT_DETAILS_ERROR } from "@/lib/dashboard/creator-response-attempts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { QuizRichText } from "@/components/quiz/quiz-rich-text";
import { formatDurationShort } from "@/lib/dashboard/quiz-detail-stats";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import { cn } from "@/lib/utils";

type QuizAttemptDetailDialogProps = {
  attemptId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resolveError?: (error: string) => string;
};

export function QuizAttemptDetailDialog({
  attemptId,
  open,
  onOpenChange,
  resolveError,
}: QuizAttemptDetailDialogProps) {
  const { locale } = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<
    Extract<GetAttemptDetailsResponse, { success: true }>["attempt"] | null
  >(null);

  useEffect(() => {
    if (!open || !attemptId) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setErrorCode(null);

    getAttemptDetails(attemptId)
      .then((result) => {
        if (cancelled) return;
        if (!result.success) {
          setErrorCode(result.error);
          setError(resolveError ? resolveError(result.error) : result.error);
          setAttempt(null);
          return;
        }
        setAttempt(result.attempt);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load attempt details");
          setAttempt(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attemptId, open]);

  const orderedAnswers = attempt
    ? [...attempt.answers].sort((a, b) => {
        const orderA =
          attempt.questionOrder?.find((q) => q.id === a.questionId)?.order ?? 0;
        const orderB =
          attempt.questionOrder?.find((q) => q.id === b.questionId)?.order ?? 0;
        return orderA - orderB;
      })
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t(locale, "dashboard.attemptDetailsStats")}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t(locale, "common.loading")}</p>
        ) : null}

        {error ? (
          <div className="space-y-1">
            {errorCode === ATTEMPT_DETAILS_ERROR.PURGED ? (
              <p className="text-sm font-medium text-foreground">
                {t(locale, "dashboard.attemptDetailsPurged")}
              </p>
            ) : null}
            <p
              className={cn(
                "text-sm",
                errorCode === ATTEMPT_DETAILS_ERROR.PURGED
                  ? "text-muted-foreground"
                  : "text-destructive",
              )}
            >
              {error}
            </p>
          </div>
        ) : null}

        {attempt ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">{attempt.participantName}</span>
                {attempt.participantEmail ? (
                  <span className="text-xs text-muted-foreground">{attempt.participantEmail}</span>
                ) : null}
              </div>
              {attempt.status === "COMPLETED" && attempt.score != null ? (
                <Badge variant="outline" className="tabular-nums">
                  {attempt.score.toFixed(1)}%
                </Badge>
              ) : null}
              <Badge
                variant={attempt.status === "ABANDONED" ? "destructive" : "secondary"}
              >
                {attempt.status === "COMPLETED"
                  ? t(locale, "dashboard.attemptStatus.completed")
                  : attempt.status === "ABANDONED"
                    ? t(locale, "dashboard.attemptStatus.abandoned")
                    : t(locale, "dashboard.attemptStatus.started")}
              </Badge>
            </div>

            {attempt.status === "ABANDONED" ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {t(locale, "dashboard.attemptAbandoned")}
              </p>
            ) : null}

            <ol className="space-y-4">
              {orderedAnswers.map((answer, index) => (
                <li
                  key={answer.questionId}
                  className="rounded-lg border border-border bg-muted/30 p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="tabular-nums">
                      {t(locale, "dashboard.questionLabel")} {index + 1}
                    </Badge>
                    {answer.expired ? (
                      <Badge variant="destructive">
                        {t(locale, "dashboard.expiredQuestion")}
                      </Badge>
                    ) : answer.isCorrect ? (
                      <Badge className="bg-green-600 text-white hover:bg-green-600">
                        <Check className="mr-1 h-3 w-3" />
                        {t(locale, "dashboard.correctLabel")}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <X className="mr-1 h-3 w-3" />
                        {t(locale, "dashboard.incorrectLabel")}
                      </Badge>
                    )}
                    {answer.timeSpent != null ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {t(locale, "dashboard.timeSpentLabel")}:{" "}
                        {formatDurationShort(answer.timeSpent)}
                      </span>
                    ) : null}
                  </div>

                  <QuizRichText
                    html={answer.questionLabel}
                    className="text-sm font-medium text-foreground"
                  />

                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t(locale, "dashboard.yourAnswerLabel")}
                    </p>
                    {answer.selectedOptions.length > 0 ? (
                      answer.selectedOptions.map((option) => (
                        <p
                          key={option.id}
                          className={cn(
                            "text-sm",
                            answer.isCorrect && !answer.expired
                              ? "font-medium text-green-700 dark:text-green-400"
                              : "text-foreground",
                          )}
                        >
                          {option.label}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">—</p>
                    )}
                  </div>

                  {!answer.isCorrect && !answer.expired ? (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t(locale, "dashboard.correctAnswerLabel")}
                      </p>
                      {answer.correctOptions.map((option) => (
                        <p
                          key={option.id}
                          className="text-sm text-green-700 dark:text-green-400"
                        >
                          {option.label}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
