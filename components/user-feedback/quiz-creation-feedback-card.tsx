"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import { submitQuizCreationReviewAction } from "@/app/feedback/actions";
import { StarRating } from "@/components/user-feedback/star-rating";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type QuizCreationFeedbackCardProps = {
  quizId: string;
  questionCount?: number;
  quizStatus?: string;
  className?: string;
};

export function QuizCreationFeedbackCard({
  quizId,
  questionCount,
  quizStatus,
  className,
}: QuizCreationFeedbackCardProps) {
  const { locale } = useLocale();
  const pathname = usePathname();
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === null) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : "";
      const page = pathname || `/dashboard/quiz/${quizId}/success`;

      const result = await submitQuizCreationReviewAction(
        {
          rating,
          message: message.trim() || undefined,
          quizId,
          page,
          userAgent,
        },
        { questionCount, quizStatus },
      );

      if (!result.success) {
        const errorMessage = result.error.startsWith("errors.")
          ? t(locale, "userFeedback.creation.error")
          : result.error;
        setError(errorMessage);
        return;
      }

      setIsSuccess(true);
    } catch {
      setError(t(locale, "userFeedback.creation.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground",
          className,
        )}
      >
        {t(locale, "userFeedback.creation.success")}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-muted/20 px-4 py-4 sm:px-5",
        className,
      )}
    >
      <p className="text-xl font-semibold text-foreground">
        {t(locale, "userFeedback.creation.title")}
      </p>
      <p className="mt-1 text-base text-muted-foreground">
        {t(locale, "userFeedback.creation.subtitle")}
      </p>

      <div className="mt-4">
        <StarRating
          id="quiz-creation-feedback-rating"
          value={rating}
          onChange={setRating}
          disabled={isSubmitting}
        />
      </div>

      {rating !== null ? (
        <div className="mt-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="quiz-creation-feedback-message" className="text-sm">
              {t(locale, "userFeedback.creation.messageLabel")}
            </Label>
            <Textarea
              id="quiz-creation-feedback-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t(locale, "userFeedback.creation.messagePlaceholder")}
              rows={3}
              maxLength={1500}
              disabled={isSubmitting}
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {t(locale, "userFeedback.creation.submit")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
