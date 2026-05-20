"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  Clock,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  MessageCircleQuestionMark,
  CheckCircle2,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { formatQuizTimeRemainingHuman } from "@/lib/quiz/formatQuizTimeRemainingHuman";
import { resolveQuizActionError } from "@/lib/quiz/resolveQuizActionError";
import { startQuizAttempt } from "@/app/quiz-link/actions";
import {
  recordAnonymousLinkOpen,
  recordAnonymousQuizStart,
} from "@/app/quiz-link/anonymous-quiz-stats-actions";

type QuizLink = {
  id: string;
  quizId: string;
  token: string;
  participantId: string | null;
  participant: {
    id: string;
    name: string;
    email: string | null;
    publicToken: string | null;
  } | null;
  allowMultipleAttempts: boolean;
  expiresAt: Date | null;
  hasCompletedAttempt: boolean;
  quiz: {
    id: string;
    name: string;
    visibility: string;
    settings: Record<string, unknown>;
    questions: Array<{
      id: string;
      type: string;
      label: string;
      image: string | null;
      imageKey?: string | null;
      order: number;
      options: Array<{
        id: string;
        label: string;
        isCorrect?: boolean;
      }>;
    }>;
  };
};

type QuizIntroductionContentProps = {
  quizLink: QuizLink;
  token: string;
};

export function QuizIntroductionContent({
  quizLink,
  token,
}: QuizIntroductionContentProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const prefersReducedMotion = useReducedMotion();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPublicLink = quizLink.participantId === null;

  useEffect(() => {
    if (!isPublicLink) {
      return;
    }
    void recordAnonymousLinkOpen(token);
  }, [isPublicLink, token]);

  const settings = quizLink.quiz.settings as {
    showAnswerImmediately?: boolean;
    randomizeQuestions?: boolean;
    timeLimitPerQuestion?: number | null;
  };

  const portalToken = quizLink.participant?.publicToken ?? null;
  const isCompleted =
    !isPublicLink && !quizLink.allowMultipleAttempts && quizLink.hasCompletedAttempt;

  const hasTimeLimit =
    settings.timeLimitPerQuestion != null && settings.timeLimitPerQuestion > 0;

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isPublicLink) {
        const statsResult = await recordAnonymousQuizStart(token);
        if (!statsResult.success) {
          setError(resolveQuizActionError(locale, statsResult.error));
          setIsLoading(false);
          return;
        }
        router.push(`/quiz/${token}/play`);
        setIsLoading(false);
        return;
      }

      const attemptResult = await startQuizAttempt(
        quizLink.id,
        quizLink.participantId,
      );

      if (!attemptResult.success) {
        const errorKey = attemptResult.error;
        if (errorKey === "alreadyCompleted") {
          setError(t(locale, "quiz.alreadyCompleted"));
        } else {
          setError(resolveQuizActionError(locale, attemptResult.error));
        }
        setIsLoading(false);
        return;
      }

      router.push(`/quiz/${token}/play?attemptId=${attemptResult.attempt.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t(locale, "common.error"),
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {portalToken && (
          <Link
            href={`/p/${portalToken}`}
            className="mb-6 inline-flex items-center gap-1.5 text-base text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t(locale, "quiz.backToPortal")}
          </Link>
        )}

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.28 }}
          className="space-y-6 rounded-3xl border border-border/80 bg-card/95 p-5 shadow-sm sm:space-y-8 sm:p-8 sm:shadow-lg"
        >
          {quizLink.participant && (
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {isCompleted
                ? t(locale, "quiz.personalizedLinkCompleted", {
                    name: quizLink.participant.name,
                  })
                : t(locale, "quiz.personalizedLinkGreeting", {
                    name: quizLink.participant.name,
                  })}
            </p>
          )}

          {!isCompleted && (
            <p className="text-sm font-medium text-muted-foreground">
              {t(locale, "quiz.readyToStart")}
            </p>
          )}

          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {quizLink.quiz.name}
          </h1>

          <div className="flex flex-wrap gap-3">
            <div className="flex min-w-[10rem] flex-1 items-center gap-3 rounded-2xl border border-border/80 bg-muted/30 px-5 py-3">
              <MessageCircleQuestionMark className="h-5 w-5 shrink-0 text-foreground" />
              <p className="text-base font-medium text-foreground">
                {quizLink.quiz.questions.length}{" "}
                {t(locale, "quiz.questions").toLowerCase()}
              </p>
            </div>
            {hasTimeLimit && (
              <div className="flex min-w-[10rem] flex-1 items-center gap-3 rounded-2xl border border-border/80 bg-muted/30 px-5 py-3">
                <Clock className="h-5 w-5 shrink-0 text-foreground" />
                <p className="text-base font-medium text-foreground">
                  {formatQuizTimeRemainingHuman(
                    settings.timeLimitPerQuestion!,
                    locale,
                  )}{" "}
                  / {t(locale, "quiz.perQuestion")}
                </p>
              </div>
            )}
          </div>

          <div
            className={
              quizLink.allowMultipleAttempts
                ? "flex gap-3 rounded-2xl border border-border/80 bg-muted/30 px-5 py-3"
                : "flex gap-3 rounded-2xl border border-orange-200/70 bg-orange-50/60 px-5 py-3 dark:border-orange-900/40 dark:bg-orange-950/25"
            }
          >
            {quizLink.allowMultipleAttempts ? (
              <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" />
            )}
            <p className="text-base font-medium text-foreground">
                {quizLink.allowMultipleAttempts
                    ? t(locale, "quiz.multipleAttempts")
                    : t(locale, "quiz.singleAttempt")}
            </p>
          </div>

          {isCompleted ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/80 bg-muted/40 px-4 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-foreground">
                {t(locale, "quiz.alreadyCompleted")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <Alert variant="error">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </Alert>
              )}

              <Button
                onClick={handleStart}
                disabled={isLoading}
                variant="blue"
                size="lg"
                className="h-12 w-full text-base"
              >
                {isLoading
                  ? t(locale, "common.loading")
                  : t(locale, "quiz.startQuiz")}
              </Button>

              {isPublicLink ? (
                <p className="mx-auto max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
                  {t(locale, "quiz.anonymousIntroLegalPrefix")}
                  <Link
                    href="/legal/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {t(locale, "auth.signUp.legalTermsLink")}
                  </Link>
                  {t(locale, "quiz.anonymousIntroLegalMid")}
                  <Link
                    href="/legal/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {t(locale, "auth.signUp.legalPrivacyLink")}
                  </Link>
                  {t(locale, "quiz.anonymousIntroLegalEnd")}
                </p>
              ) : null}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
