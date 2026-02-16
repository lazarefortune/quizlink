"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileQuestion, Play, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { getPublicQuizzesPage, type PublicQuizItem } from "./actions";
import { getOrCreatePublicQuizLink } from "@/app/quiz-link/actions";

const PAGE_SIZE = 12;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35 },
  }),
};

export default function DashboardCommunityPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const [quizzes, setQuizzes] = useState<PublicQuizItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingQuizId, setLoadingQuizId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadPage = useCallback(async (p: number, search: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getPublicQuizzesPage(p, PAGE_SIZE, search || undefined);
      if (result.success) {
        setQuizzes(result.quizzes);
        setTotal(result.total);
      } else {
        setError(result.error ?? "Failed to load");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(page, searchQuery);
  }, [page, searchQuery, loadPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
    setPage(1);
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
      setError(result.error ?? "Failed to start");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setLoadingQuizId(null);
    }
  };

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
      <motion.div
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div custom={0} variants={fadeUp} className="space-y-4">
          <h2 className="text-2xl font-black text-foreground sm:text-3xl">
            {t(locale, "publicQuizzes.title")}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t(locale, "publicQuizzes.subtitle")}
          </p>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder={t(locale, "dashboard.searchPlaceholder")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
                aria-label={t(locale, "common.search")}
              />
            </div>
            <Button type="submit" variant="secondary" size="default">
              {t(locale, "common.search")}
            </Button>
          </form>
        </motion.div>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} variant="playful">
                <CardContent className="p-5 space-y-4">
                  <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-20 bg-muted/60 rounded animate-pulse" />
                  <div className="h-9 w-20 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <Card variant="playful" className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
              <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t(locale, "publicQuizzes.noQuizzes")}
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {t(locale, "publicQuizzes.noQuizzesDescription")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
              {quizzes.map((quiz) => (
                <div key={quiz.id}>
                  <Card variant="playful" className="flex flex-col h-full">
                    <CardContent className="flex flex-col flex-1 p-5">
                      <h3 className="text-lg font-bold leading-snug line-clamp-2 mb-4">
                        {quiz.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {quiz.questionsCount}{" "}
                        {quiz.questionsCount === 1
                          ? t(locale, "dashboard.question")
                          : t(locale, "dashboard.questions")}
                      </p>
                      <Button
                        variant="blue"
                        size="default"
                        className="mt-auto gap-2 w-full sm:w-auto"
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
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
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
      </motion.div>
    </div>
  );
}
