"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

type QuizResults = {
  quizId: string;
  totalQuestions: number;
  correctAnswers: number;
  detailedResults: Array<{
    questionId: string;
    isCorrect: boolean;
  }>;
};

export default function QuizResultsPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const [results, setResults] = useState<QuizResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResults() {
      const resultsData = sessionStorage.getItem("quizResults");
      if (!resultsData) {
        router.push("/generate");
        return;
      }

      try {
        const parsedResults = JSON.parse(resultsData);
        setResults(parsedResults);
        setIsLoading(false);
      } catch {
        router.push("/generate");
      }
    }

    loadResults();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-muted-foreground">{t(locale, "common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-2xl">
          <Alert variant="error">
            {error || "Failed to load results"}
          </Alert>
          <Button onClick={() => router.push("/generate")} className="mt-4">
            {t(locale, "quiz.quit")}
          </Button>
        </div>
      </div>
    );
  }

  const scorePercentage = Math.round(
    (results.correctAnswers / results.totalQuestions) * 100
  );
  const isPassing = scorePercentage >= 70;

  const handleRetry = () => {
    sessionStorage.removeItem("quizResults");
    router.push("/quiz/play");
  };

  const handleNewQuiz = () => {
    sessionStorage.removeItem("currentQuiz");
    sessionStorage.removeItem("quizResults");
    router.push("/generate");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-4xl font-bold">Quiz Results</h1>
        </header>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              {isPassing ? (
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              )}
            </div>
            <CardTitle className="text-3xl">
              {results.correctAnswers} / {results.totalQuestions}
            </CardTitle>
            <CardDescription className="text-lg">
              {scorePercentage}% {t(locale, "quiz.correct")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPassing ? (
              <Alert variant="success" title="Congratulations!">
                You passed the quiz with a score of {scorePercentage}%.
              </Alert>
            ) : (
              <Alert variant="error" title="Keep Practicing">
                You scored {scorePercentage}%. Try again to improve your score!
              </Alert>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Question Breakdown</h3>
              <div className="space-y-2">
                {results.detailedResults.map((result, index) => {
                  return (
                    <div
                      key={result.questionId}
                      className="flex items-start gap-3 p-3 rounded-md border"
                    >
                      {result.isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Q{index + 1}: {result.isCorrect ? t(locale, "quiz.correct") : t(locale, "quiz.incorrect")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button variant="ghost" onClick={handleRetry} className="flex-1">
              Retry Quiz
            </Button>
            <Button
              variant="primary"
              onClick={handleNewQuiz}
              className="flex-1"
            >
              Create New Quiz
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
