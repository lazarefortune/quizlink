"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatScoreWithPercent } from "@/lib/formatScore";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";

type QuizPlayFinishSummaryCardProps = {
  score: number;
  totalQuestions: number;
  correctAnswersCount: number;
  showAnswersAtEnd: boolean;
  hiddenDetailsMessageKey?: "quiz.answerDetailsHidden" | "quiz.previewAnswersHidden";
  descriptionKey?: string;
  footer: ReactNode;
};

export function QuizPlayFinishSummaryCard({
  score,
  totalQuestions,
  correctAnswersCount,
  showAnswersAtEnd,
  hiddenDetailsMessageKey = "quiz.answerDetailsHidden",
  descriptionKey,
  footer,
}: QuizPlayFinishSummaryCardProps) {
  const { locale } = useLocale();
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.26 }}
    >
      <Card>
        <CardHeader className="text-center sm:text-left">
          <CardTitle>{t(locale, "quiz.finish")}</CardTitle>
          {descriptionKey ? (
            <CardDescription>{t(locale, descriptionKey)}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center sm:text-left">
            <p className="text-2xl font-bold tabular-nums sm:text-3xl">
              {formatScoreWithPercent(score, totalQuestions)}
            </p>
            <p className="mt-1 text-muted-foreground">
              {correctAnswersCount} / {totalQuestions}{" "}
              {t(locale, "quiz.correctAnswers")}
            </p>
            {!showAnswersAtEnd && (
              <p className="mt-3 text-sm text-muted-foreground">
                {t(locale, hiddenDetailsMessageKey)}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
          {footer}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
