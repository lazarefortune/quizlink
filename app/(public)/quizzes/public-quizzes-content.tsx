"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileQuestion,
  Play,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 12;
  const totalPages = Math.max(1, Math.ceil(quizzes.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginatedQuizzes = quizzes.slice(startIndex, startIndex + PAGE_SIZE);

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

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
      <div className="container mx-auto w-full px-4 py-8 sm:py-12 max-w-7xl">
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
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {paginatedQuizzes.map((quiz) => (
                <Card
                  key={quiz.id}
                  className="flex h-full flex-col border-border/60 transition-shadow hover:shadow-md"
                >
                  <CardContent className="flex flex-1 flex-col p-5">
                    <div className="mb-4 space-y-2">
                      <h2 className="line-clamp-2 text-lg font-semibold leading-snug">
                        {quiz.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {quiz.questionsCount}{" "}
                        {quiz.questionsCount === 1
                          ? t(locale, "dashboard.question")
                          : t(locale, "dashboard.questions")}
                      </p>
                    </div>

                    <div className="mb-4 flex items-center gap-3 text-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground">
                        {getInitials(quiz.ownerName)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {quiz.ownerName ??
                            t(locale, "publicQuizzes.anonymousAuthor")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t(locale, "publicQuizzes.authorLabel")}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="blue"
                      size="default"
                      className="mt-auto w-full gap-2"
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
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t(locale, "dashboard.previousPage")}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t(locale, "dashboard.pageOf")
                    .replace("{current}", String(page))
                    .replace("{total}", String(totalPages))}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="gap-1"
                >
                  {t(locale, "dashboard.nextPage")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
