"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { formatScoreWithPercent } from "@/lib/formatScore";
import { formatAnswerDuration } from "@/lib/formatAnswerDuration";
import {
  clearAnonymousQuizResultFromSession,
  loadAnonymousQuizResultFromSession,
  type AnonymousQuizResultSession,
} from "@/lib/anonymousQuizResultSession";
import type { Locale } from "@/lib/i18n";

type AnonymousQuizResultsContentProps = {
  token: string;
};

function AnonymousQuizLegalFooter({ locale }: { locale: Locale }) {
  return (
    <p className="mt-8 text-center text-xs text-muted-foreground">
      <Link
        href="/legal/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary underline-offset-2 hover:underline"
      >
        {t(locale, "auth.signUp.legalTermsLink")}
      </Link>
      {t(locale, "quiz.anonymousResultsLegalSeparator")}
      <Link
        href="/legal/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary underline-offset-2 hover:underline"
      >
        {t(locale, "auth.signUp.legalPrivacyLink")}
      </Link>
    </p>
  );
}

export function AnonymousQuizResultsContent({
  token,
}: AnonymousQuizResultsContentProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const prefersReducedMotion = useReducedMotion();
  const [result, setResult] = useState<AnonymousQuizResultSession | null | undefined>(undefined);

  useEffect(() => {
    setResult(loadAnonymousQuizResultFromSession(token));
  }, [token]);

  const handleRestart = () => {
    clearAnonymousQuizResultFromSession(token);
    router.push(`/quiz/${token}/play`);
  };

  const handleBackToQuiz = () => {
    router.push(`/quiz/${token}`);
  };

  if (result === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t(locale, "quiz.loading")}</p>
      </div>
    );
  }

  if (result === null) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="mx-auto max-w-xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t(locale, "quiz.anonymousResultUnavailableTitle")}</CardTitle>
              <CardDescription>{t(locale, "quiz.anonymousResultUnavailableDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t(locale, "quiz.anonymousResultNotStored")}
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-start sm:gap-3">
              <Button className="w-full sm:w-auto" variant="blue" onClick={handleRestart}>
                {t(locale, "quiz.replayQuiz")}
              </Button>
              <Button className="w-full sm:w-auto" variant="outline" onClick={handleBackToQuiz}>
                {t(locale, "quiz.returnToQuiz")}
              </Button>
            </CardFooter>
          </Card>
          <AnonymousQuizLegalFooter locale={locale} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <motion.h1
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.24 }}
          className="text-center text-2xl font-bold"
        >
          {result.quizName}
        </motion.h1>
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.26 }}
        >
          <Card>
          <CardHeader className="text-center sm:text-left">
            <CardTitle>{t(locale, "quiz.finish")}</CardTitle>
            <CardDescription>{t(locale, "quiz.anonymousResultDetailNote")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center sm:text-left">
              <p className="text-2xl sm:text-3xl font-bold tabular-nums">
                {formatScoreWithPercent(result.score, result.totalQuestions)}
              </p>
              <p className="mt-1 text-muted-foreground">
                {result.correctAnswersCount} / {result.totalQuestions} {t(locale, "quiz.correctAnswers")}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
            <Button variant="blue" className="w-full sm:w-auto" onClick={handleRestart}>
              {t(locale, "quiz.restart")}
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" onClick={handleBackToQuiz}>
              {t(locale, "quiz.returnToQuiz")}
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => router.push("/")}>
              {t(locale, "nav.home")}
            </Button>
          </CardFooter>
          </Card>
        </motion.div>

        {result.details.length > 0 && (
          <section id="anonymous-quiz-corrections" className="scroll-mt-8 space-y-4">
            <motion.h2
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.24, delay: prefersReducedMotion ? 0 : 0.08 }}
              className="text-lg font-semibold"
            >
              {t(locale, "quiz.anonymousQuizCorrectionsHeading")}
            </motion.h2>
            <ul className="space-y-4">
              {result.details.map((row, index) => {
                const hasSelected = row.selectedOptionIds.length > 0;
                const selectedText = hasSelected
                  ? row.selectedOptionLabels.filter(Boolean).join(", ") || row.selectedOptionIds.join(", ")
                  : null;
                const correctText =
                  row.correctOptionLabels.filter(Boolean).join(", ") || row.correctOptionIds.join(", ");

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
                        {row.questionImage && (
                          <div className="relative mb-2 h-52 w-full overflow-hidden rounded-md border bg-muted/30">
                            <Image
                              src={row.questionImage}
                              alt={row.questionLabel}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <CardTitle className="text-base font-medium leading-snug">
                            {index + 1}. {row.questionLabel}
                          </CardTitle>
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
                      <CardContent className="space-y-3 text-sm">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {t(locale, "quiz.yourAnswer")}
                          </p>
                          <p className="mt-1 text-foreground">
                            {hasSelected ? selectedText : t(locale, "quiz.noAnswer")}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {t(locale, "quiz.correctAnswer")}
                          </p>
                          <p className="mt-1 text-foreground">{correctText}</p>
                        </div>
                        {row.explanation?.trim() && (
                          <Alert variant="info" className="border-blue/40 bg-blue/5">
                            <span className="font-medium">{t(locale, "quiz.explanation")}</span>
                            <p className="mt-1 text-sm text-muted-foreground">{row.explanation.trim()}</p>
                          </Alert>
                        )}
                        {row.timeSpent != null && row.timeSpent > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {t(locale, "quiz.timeSpent")}: {formatAnswerDuration(row.timeSpent)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.li>
                );
              })}
            </ul>
          </section>
        )}
        <AnonymousQuizLegalFooter locale={locale} />
      </div>
    </div>
  );
}
