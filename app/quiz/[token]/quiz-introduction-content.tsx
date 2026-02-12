"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Clock, Users, FileQuestion, AlertCircle } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { startQuizAttempt } from "@/app/quiz-link/actions";

type QuizLink = {
  id: string;
  quizId: string;
  token: string;
  participantId: string | null;
  participant: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  allowMultipleAttempts: boolean;
  expiresAt: Date | null;
  hasCompletedAttempt: boolean;
  quiz: {
    id: string;
    name: string;
    visibility: string;
    settings: any;
    questions: Array<{
      id: string;
      type: string;
      label: string;
      image: string | null;
      order: number;
      options: Array<{
        id: string;
        label: string;
        isCorrect: boolean;
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const settings = quizLink.quiz.settings as {
    showAnswerImmediately?: boolean;
    randomizeQuestions?: boolean;
    timeLimitPerQuestion?: number | null;
  };

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let participantId: string | null = null;

      // For personalized links, use existing participantId
      if (quizLink.participantId) {
        participantId = quizLink.participantId;
      }
      // For public links, participantId remains null (anonymous)

      // Start attempt
      const attemptResult = await startQuizAttempt(
        quizLink.id,
        participantId
      );

      if (!attemptResult.success) {
        // Check if error is a translation key
        const errorKey = attemptResult.error;
        if (errorKey === "alreadyCompleted") {
          setError(t(locale, "quiz.alreadyCompleted"));
        } else {
          setError(attemptResult.error);
        }
        setIsLoading(false);
        return;
      }

      // Redirect to play page
      router.push(`/quiz/${token}/play?attemptId=${attemptResult.attempt.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t(locale, "common.error")
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">
              {quizLink.quiz.name}
            </CardTitle>
            <CardDescription>
              {quizLink.participant
                ? !quizLink.allowMultipleAttempts && quizLink.hasCompletedAttempt
                  ? t(locale, "quiz.personalizedLinkCompleted", { name: quizLink.participant.name })
                  : t(locale, "quiz.personalizedLinkGreeting", { name: quizLink.participant.name })
                : t(locale, "quiz.introductionDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quiz Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <FileQuestion className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">
                    {quizLink.quiz.questions.length}
                  </p>
                  <p className="text-base text-muted-foreground">
                    {t(locale, "quiz.questions")}
                  </p>
                </div>
              </div>
              {settings.timeLimitPerQuestion && (
                <div className="flex items-center gap-2">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">
                      {settings.timeLimitPerQuestion}s
                    </p>
                    <p className="text-base text-muted-foreground">
                      {t(locale, "quiz.perQuestion")}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">
                    {quizLink.allowMultipleAttempts
                      ? t(locale, "quiz.multipleAttempts")
                      : t(locale, "quiz.singleAttempt")}
                  </p>
                  <p className="text-base text-muted-foreground">
                    {t(locale, "quiz.attempts")}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="error">
                <AlertCircle className="h-4 w-4" />
                {error}
              </Alert>
            )}

            {/* Start Button */}
            <div className="space-y-4 border-t border-border pt-6">
              {!quizLink.allowMultipleAttempts && quizLink.hasCompletedAttempt ? (
                <div className="text-center space-y-2 py-4">
                  <p className="text-sm text-muted-foreground">
                    {t(locale, "quiz.alreadyCompleted")}
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleStart}
                  disabled={isLoading}
                  className="w-full"
                  variant="blue"
                  size="lg"
                >
                  {isLoading
                    ? t(locale, "common.loading")
                    : t(locale, "quiz.startQuiz")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
