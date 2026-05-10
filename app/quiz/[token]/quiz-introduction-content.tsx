"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  Clock,
  FileQuestion,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
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

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isPublicLink) {
        const statsResult = await recordAnonymousQuizStart(token);
        if (!statsResult.success) {
          setError(statsResult.error);
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
          setError(attemptResult.error);
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
    <div className="min-h-screen bg-background">
      {/* Content */}
      <div className="container max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {portalToken && (
          <Link
            href={`/p/${portalToken}`}
            className="inline-flex items-center gap-1.5 text-base text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {t(locale, "quiz.backToPortal")}
          </Link>
        )}
        <div className="space-y-8">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.24 }}
            className="flex flex-col gap-4"
          >
            {/* Greeting */}
            {quizLink.participant && (
              <p className="text-muted-foreground text-lg h1">
                {isCompleted
                  ? t(locale, "quiz.personalizedLinkCompleted", {
                      name: quizLink.participant.name,
                    })
                  : t(locale, "quiz.personalizedLinkGreeting", {
                      name: quizLink.participant.name,
                    })}
              </p>
            )}

            {!quizLink.participant && (
              <p className="text-muted-foreground font-normal text-lg">
                {t(locale, "quiz.introductionDescription")}
              </p>
            )}

            {/* Quiz name */}
            <h1 className="text-3xl h1 sm:text-4xl font-bold tracking-tight">
              {quizLink.quiz.name}
            </h1>
          </motion.div>

          {/* Info pills */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.24, delay: prefersReducedMotion ? 0 : 0.05 }}
            className="flex flex-wrap gap-3"
          >
            <Badge variant="secondary" className="text-sm px-3 py-1.5 gap-1.5">
              <FileQuestion className="h-4 w-4" />
              {quizLink.quiz.questions.length} {t(locale, "quiz.questions")}
            </Badge>
            {settings.timeLimitPerQuestion && (
              <Badge
                variant="secondary"
                className="text-sm px-3 py-1.5 gap-1.5"
              >
                <Clock className="h-4 w-4" />
                {settings.timeLimitPerQuestion}s {t(locale, "quiz.perQuestion")}
              </Badge>
            )}
          </motion.div>

          {/* Attempt info */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.24, delay: prefersReducedMotion ? 0 : 0.1 }}
            className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4"
          >
            {quizLink.allowMultipleAttempts ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 shrink-0 mt-0.5 mr-1" />
                <p className="text-sm text-foreground">
                  {t(locale, "quiz.multipleAttempts")}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 mr-1 text-orange-700 dark:text-orange-400" />
                <p className="text-sm text-orange-700 dark:text-orange-400">
                  {t(locale, "quiz.singleAttempt")}
                </p>
              </div>
            )}
          </motion.div>

          {/* Error */}
          {error && (
            <Alert variant="error">
              <AlertCircle className="h-4 w-4" />
              {error}
            </Alert>
          )}

          {/* Action */}
          {isCompleted ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                {t(locale, "quiz.alreadyCompleted")}
              </p>
            </div>
          ) : (
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.24, delay: prefersReducedMotion ? 0 : 0.14 }}
            >
              <Button
                onClick={handleStart}
                disabled={isLoading}
                variant="blue"
                size="lg"
                className="w-full text-base"
              >
                {isLoading
                  ? t(locale, "common.loading")
                  : isCompleted
                    ? t(locale, "quiz.restart")
                    : t(locale, "quiz.startQuiz")}
              </Button>
              {isPublicLink ? (
                <p className="text-center text-xs leading-relaxed text-muted-foreground mt-4">
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
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
