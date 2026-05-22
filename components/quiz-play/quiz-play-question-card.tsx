"use client";

import type { ReactNode } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QuizQuestionImage } from "@/components/quiz/quiz-question-image";
import { QuizQuestionTypeBadge } from "@/components/quiz/quiz-question-type-badge";
import { QuizRichText } from "@/components/quiz/quiz-rich-text";
import { getQuizPlayOptionVisualState } from "@/lib/quiz/quizPlayOptionStyles";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import { cn } from "@/lib/utils";

export type QuizPlayQuestionOption = {
  id: string;
  label: string;
};

type QuizPlayQuestionCardProps = {
  questionType: string;
  questionLabel: string;
  questionImageSrc: string | null;
  options: QuizPlayQuestionOption[];
  isLocked: boolean;
  showCorrection: boolean;
  showAnswerImmediately: boolean;
  isVerified: boolean;
  isCorrect?: boolean;
  explanation?: string | null;
  isOptionSelected: (optionId: string) => boolean;
  isOptionCorrect: (optionId: string) => boolean;
  isOptionIncorrect: (optionId: string) => boolean;
  onSelectOption: (optionId: string) => void;
  onPrevious: () => void;
  onVerify?: () => void;
  onNext: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isAnswered: boolean;
  isSubmitting?: boolean;
  actionsDisabled?: boolean;
  footerExtra?: ReactNode;
};

export function QuizPlayQuestionCard({
  questionType,
  questionLabel,
  questionImageSrc,
  options,
  isLocked,
  showCorrection,
  showAnswerImmediately,
  isVerified,
  isCorrect,
  explanation,
  isOptionSelected,
  isOptionCorrect,
  isOptionIncorrect,
  onSelectOption,
  onPrevious,
  onVerify,
  onNext,
  isFirstQuestion,
  isLastQuestion,
  isAnswered,
  isSubmitting = false,
  actionsDisabled = false,
  footerExtra,
}: QuizPlayQuestionCardProps) {
  const { locale } = useLocale();

  return (
    <Card>
      <CardHeader className="p-5 sm:p-6">
        <QuizQuestionImage src={questionImageSrc} />
        <CardTitle className="mb-3 text-xl font-medium">
          <QuizRichText html={questionLabel} />
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <QuizQuestionTypeBadge type={questionType} locale={locale} />
          {isLocked && !showCorrection ? (
            <Badge variant="secondary">{t(locale, "quiz.answerLocked")}</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-5 pt-0 sm:p-6 sm:pt-0">
        {options.map((option, index) => {
          const selected = isOptionSelected(option.id);
          const correct = isOptionCorrect(option.id);
          const incorrect = isOptionIncorrect(option.id);
          const optionLetter = String.fromCharCode(65 + index);
          const visual = getQuizPlayOptionVisualState({
            showCorrection,
            selected,
            correct,
            incorrect,
          });

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelectOption(option.id)}
              disabled={isLocked || actionsDisabled}
              className={cn(
                "w-full rounded-lg border-2 p-4 text-left transition-all duration-200",
                !visual.borderColor && "border-border",
                isLocked || actionsDisabled
                  ? "cursor-not-allowed"
                  : "cursor-pointer hover:shadow-sm",
                selected ? "border-b-4" : "",
              )}
              style={visual.borderColor ? { borderColor: visual.borderColor } : undefined}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-semibold transition-colors sm:h-10 sm:w-10",
                    visual.letterBgColor,
                    visual.letterTextColor,
                  )}
                >
                  {optionLetter}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="break-words text-base">{option.label}</span>
                </div>
              </div>
            </button>
          );
        })}
      </CardContent>
      {showAnswerImmediately &&
        isVerified &&
        isCorrect === false &&
        explanation?.trim() && (
          <div className="px-5 pb-4 sm:px-6">
            <Alert variant="info" className="border-blue/40 bg-blue/5">
              <span className="font-medium">{t(locale, "quiz.explanation")}</span>
              <p className="mt-1 text-sm text-muted-foreground">{explanation.trim()}</p>
            </Alert>
          </div>
        )}
      <CardFooter className="flex gap-4 p-5 pt-0 sm:p-6 sm:pt-0">
        <Button
          variant="ghost"
          onClick={onPrevious}
          disabled={isFirstQuestion || actionsDisabled}
        >
          {t(locale, "quiz.previous")}
        </Button>
        {showAnswerImmediately && !isLocked && onVerify ? (
          <Button
            variant="blue"
            onClick={onVerify}
            disabled={!isAnswered || isSubmitting || actionsDisabled}
            className="ml-auto"
          >
            {isSubmitting ? t(locale, "common.loading") : t(locale, "quiz.verify")}
          </Button>
        ) : (
          <Button
            variant="blue"
            onClick={onNext}
            disabled={(!isAnswered && !isLocked) || actionsDisabled}
            className="ml-auto"
          >
            {isLastQuestion ? t(locale, "quiz.finish") : t(locale, "quiz.continue")}
          </Button>
        )}
        {footerExtra}
      </CardFooter>
    </Card>
  );
}
