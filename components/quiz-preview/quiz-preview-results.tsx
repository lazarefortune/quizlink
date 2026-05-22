"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Share2, XCircle } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { QuizPreviewBanner } from "@/components/quiz-play/quiz-preview-banner";
import { QuizPlayFinishSummaryCard } from "@/components/quiz-play/quiz-play-finish-summary-card";
import { QuizPlayResultsLayout } from "@/components/quiz-play/quiz-play-results-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { QuizRichText } from "@/components/quiz/quiz-rich-text";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import { richTextToPlainText } from "@/lib/rich-text/richTextToPlainText";
import type { QuizPreviewDetailRow } from "@/lib/quiz/quiz-preview-scoring";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

type QuizPreviewResultsProps = {
  quizId: string;
  quizName: string;
  quizStatus: QuizLifecycleStatus;
  score: number;
  totalQuestions: number;
  correctAnswersCount: number;
  showAnswersAtEnd: boolean;
  details: QuizPreviewDetailRow[];
  onReplay: () => void;
  onShare?: () => void;
};

export function QuizPreviewResults({
  quizId,
  quizName,
  quizStatus,
  score,
  totalQuestions,
  correctAnswersCount,
  showAnswersAtEnd,
  details,
  onReplay,
  onShare,
}: QuizPreviewResultsProps) {
  const { locale } = useLocale();
  const prefersReducedMotion = useReducedMotion();
  const shouldShowAnswerDetails = showAnswersAtEnd;

  return (
    <QuizPlayResultsLayout
      quizName={quizName}
      topBanner={<QuizPreviewBanner quizId={quizId} />}
    >
      <QuizPlayFinishSummaryCard
        score={score}
        totalQuestions={totalQuestions}
        correctAnswersCount={correctAnswersCount}
        showAnswersAtEnd={showAnswersAtEnd}
        hiddenDetailsMessageKey="quiz.previewAnswersHidden"
        descriptionKey="quiz.previewNotSaved"
        footer={
          <>
            <Button variant="blue" className="w-full sm:w-auto" onClick={onReplay}>
              {t(locale, "quiz.restart")}
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <Link href={`/dashboard/quiz/${quizId}`}>
                {t(locale, "quiz.previewBackToQuiz")}
              </Link>
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <Link href={`/builder/${quizId}`}>
                {quizStatus === "DRAFT"
                  ? t(locale, "dashboard.continueInBuilder")
                  : t(locale, "quiz.previewEditQuiz")}
              </Link>
            </Button>
            {quizStatus === "ACTIVE" && onShare ? (
              <Button
                variant="outline"
                className="w-full gap-2 sm:w-auto"
                onClick={onShare}
              >
                <Share2 className="h-4 w-4" />
                {t(locale, "dashboard.share")}
              </Button>
            ) : null}
          </>
        }
      />

      {shouldShowAnswerDetails && details.length > 0 && (
        <section className="scroll-mt-8 space-y-4">
          <motion.h2
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.24,
              delay: prefersReducedMotion ? 0 : 0.08,
            }}
            className="text-lg font-semibold"
          >
            {t(locale, "quiz.detailedResults")}
          </motion.h2>
          <ul className="space-y-4">
            {details.map((row, index) => {
              const hasSelected = row.selectedOptionIds.length > 0;
              const selectedText = hasSelected
                ? row.selectedOptionLabels.filter(Boolean).join(", ")
                : t(locale, "quiz.noAnswer");
              const correctText =
                row.correctOptionLabels.filter(Boolean).join(", ") ||
                row.correctOptionIds.join(", ");

              return (
                <motion.li
                  key={row.questionId}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.22,
                    delay: prefersReducedMotion ? 0 : Math.min(index * 0.05, 0.25),
                  }}
                >
                  <Card className="text-left">
                    <CardHeader className="space-y-2 pb-2">
                      {row.questionImage ? (
                        <div className="relative mb-2 h-52 w-full overflow-hidden rounded-md border bg-muted/30">
                          <Image
                            src={row.questionImage}
                            alt={richTextToPlainText(row.questionLabel)}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : null}
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-base font-medium uppercase tracking-wide text-primary">
                            {t(locale, "quiz.question")} {index + 1}
                          </p>
                          <QuizRichText
                            html={row.questionLabel}
                            className="text-base font-medium leading-snug"
                          />
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            row.isCorrect
                              ? "shrink-0 border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "shrink-0 border-destructive/50 bg-destructive/10 text-destructive"
                          }
                        >
                          {row.isCorrect ? (
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                              {t(locale, "quiz.correct")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <XCircle className="h-3.5 w-3.5" aria-hidden />
                              {t(locale, "quiz.incorrect")}
                            </span>
                          )}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">{t(locale, "quiz.yourAnswer")}:</span>{" "}
                        {selectedText}
                      </p>
                      <p>
                        <span className="font-medium">{t(locale, "quiz.correctAnswer")}:</span>{" "}
                        {correctText}
                      </p>
                      {row.explanation?.trim() ? (
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {t(locale, "quiz.explanation")}:
                          </span>{" "}
                          {row.explanation.trim()}
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                </motion.li>
              );
            })}
          </ul>
        </section>
      )}
    </QuizPlayResultsLayout>
  );
}
