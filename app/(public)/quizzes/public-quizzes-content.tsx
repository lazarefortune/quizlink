"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion, Play, ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import type { PublicQuizItem } from "./actions";
import { getOrCreatePublicQuizLink } from "@/app/quiz-link/actions";

type PublicQuizzesContentProps = {
  quizzes: PublicQuizItem[];
};

export function PublicQuizzesContent({ quizzes }: PublicQuizzesContentProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const [loadingQuizId, setLoadingQuizId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePlay = async (quizId: string) => {
    setError(null);
    setLoadingQuizId(quizId);
    try {
      const result = await getOrCreatePublicQuizLink(quizId);
      if (result.success) {
        router.push(`/quiz/${result.token}`);
        return;
      }
      setError(result.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start quiz");
    } finally {
      setLoadingQuizId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {t(locale, "publicQuizzes.backToHome")}
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {t(locale, "publicQuizzes.title")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t(locale, "publicQuizzes.subtitle")}
          </p>
        </header>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {quizzes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 px-4">
              <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">
                {t(locale, "publicQuizzes.noQuizzes")}
              </h2>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {t(locale, "publicQuizzes.noQuizzesDescription")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-4">
            {quizzes.map((quiz) => (
              <li key={quiz.id}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold truncate">
                        {quiz.name}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {quiz.questionsCount}{" "}
                        {quiz.questionsCount === 1
                          ? t(locale, "dashboard.question")
                          : t(locale, "dashboard.questions")}
                      </p>
                    </div>
                    <Button
                      variant="blue"
                      size="default"
                      className="shrink-0 gap-2"
                      onClick={() => handlePlay(quiz.id)}
                      disabled={loadingQuizId !== null}
                    >
                      {loadingQuizId === quiz.id ? (
                        t(locale, "common.loading")
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          {t(locale, "publicQuizzes.play")}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
