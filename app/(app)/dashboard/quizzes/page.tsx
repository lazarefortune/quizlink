"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getUserQuizzesPaginated,
  type UserQuizListItem,
} from "@/app/(app)/builder/actions";
import { useLocale } from "@/lib/i18n/use-locale";
import { t, type Locale } from "@/lib/i18n";
import {
  Plus,
  FileText,
  Sparkles,
  FileQuestion,
  Users,
  MessageSquare,
  Globe,
  Lock,
  Search,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react";
import { QuizOptionsMenu } from "@/components/quiz-options-menu";
import { createOrGetQuizLink } from "@/app/quiz-link/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PAGE_SIZE = 12;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35 },
  }),
};

function CreateQuizModalTrigger({
  locale,
  variant = "blue",
  size = "sm",
}: {
  locale: Locale;
  variant?: "blue" | "primary";
  size?: "sm" | "default";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        {t(locale, "nav.create")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-black">
              {locale === "fr" ? "Crée ton quiz !" : "Create your quiz!"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2 pb-1">
            <Link
              href="/builder"
              onClick={() => setOpen(false)}
              className="group flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-5 transition-all hover:border-primary hover:shadow-md active:scale-[0.97]"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <FileText className="h-7 w-7" />
              </span>
              <div className="text-center">
                <p className="text-sm font-semibold">
                  {t(locale, "nav.createManually")}
                </p>
              </div>
            </Link>
            <Link
              href="/generate"
              onClick={() => setOpen(false)}
              className="group flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-5 transition-all hover:border-blue hover:shadow-md active:scale-[0.97]"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue/10 text-blue transition-colors group-hover:bg-blue/20">
                <Sparkles className="h-7 w-7" />
              </span>
              <div className="text-center">
                <p className="text-sm font-semibold">
                  {t(locale, "nav.createWithAI")}
                </p>
              </div>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function DashboardQuizzesPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const [quizzes, setQuizzes] = useState<UserQuizListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [playLoadingQuizId, setPlayLoadingQuizId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadQuizzes = useCallback(async (p: number, search: string) => {
    setIsLoading(true);
    try {
      const result = await getUserQuizzesPaginated(
        p,
        PAGE_SIZE,
        search || undefined,
      );
      if (result.success) {
        setQuizzes(result.quizzes);
        setTotal(result.total);
      } else {
        console.error("Failed to load quizzes:", result.error);
      }
    } catch (error) {
      console.error("Error loading quizzes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuizzes(page, searchQuery);
  }, [page, searchQuery, loadQuizzes]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
    setPage(1);
  };

  const handleEdit = (quizId: string) => {
    router.push(`/builder/${quizId}`);
  };

  const refreshCurrentPage = () => {
    loadQuizzes(page, searchQuery);
  };

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";

  const handlePlay = async (quizId: string) => {
    setPlayLoadingQuizId(quizId);
    try {
      const result = await createOrGetQuizLink(quizId, true);
      if (result.success && baseUrl) {
        window.open(`${baseUrl}/quiz/${result.quizLink.token}`, "_blank", "noopener,noreferrer");
      }
    } finally {
      setPlayLoadingQuizId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-5 md:p-6 lg:p-8">
        <div className="flex items-end justify-between mb-6">
          <div className="h-8 w-40 bg-muted rounded-lg animate-pulse" />
          <div className="h-9 w-28 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} variant="playful">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
                  <div className="h-8 w-8 bg-muted rounded-md animate-pulse" />
                </div>
                <div className="h-5 w-4/5 bg-muted rounded animate-pulse" />
                <div className="flex gap-4">
                  <div className="h-4 w-20 bg-muted/60 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-muted/60 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
      <motion.div
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div
          custom={0}
          variants={fadeUp}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-black text-foreground sm:text-3xl">
                {t(locale, "dashboard.title")}
              </h2>
              <Link
                href="/dashboard/community"
                className="md:hidden inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                <Globe className="h-4 w-4 shrink-0" />
                {t(locale, "dashboard.sidebar.community")}
              </Link>
            </div>
            <div className="shrink-0">
              <CreateQuizModalTrigger locale={locale} />
            </div>
          </div>
          <form
            onSubmit={handleSearchSubmit}
            className="flex gap-2 max-w-md"
          >
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

        {/* Empty state */}
        {quizzes.length === 0 ? (
          <motion.div custom={1} variants={fadeUp}>
            <Card variant="playful" className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                  <FileQuestion className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-black mb-1">
                  {t(locale, "dashboard.noQuizzes")}
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                  {locale === "fr"
                    ? "Crée ton premier quiz manuellement ou avec l'IA pour commencer."
                    : "Create your first quiz manually or with AI to get started."}
                </p>
                <CreateQuizModalTrigger
                  locale={locale}
                  variant="primary"
                  size="default"
                />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
              {quizzes.map((quiz, i) => (
                <motion.div key={quiz.id} custom={i + 1} variants={fadeUp}>
                  <Card
                    variant="playful"
                    className="group flex flex-col h-full"
                  >
                    <CardContent className="flex flex-col flex-1 p-5">
                      <Link
                        href={`/dashboard/quiz/${quiz.id}`}
                        className="block flex-1 mb-4"
                      >
                        <h3 className="text-lg font-bold leading-snug line-clamp-2 wrap-break-word text-foreground group-hover:text-blue transition-colors">
                          {quiz.name}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="inline-flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {quiz.questionCount}{" "}
                          {quiz.questionCount === 1
                            ? t(locale, "dashboard.question")
                            : t(locale, "dashboard.questions")}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {quiz.attemptCount}{" "}
                          {t(locale, "dashboard.attempts")}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-border/60">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={
                              quiz.visibility === "PUBLIC"
                                ? "primarySoft"
                                : "warningSoft"
                            }
                            className="text-sm font-extrabold font-nunito uppercase"
                          >
                            {quiz.visibility === "PUBLIC" ? (
                              <Globe className="h-3.5 w-3.5" />
                            ) : (
                              <Lock className="h-3.5 w-3.5" />
                            )}
                            <span className="ml-2">
                              {quiz.visibility === "PUBLIC"
                                ? t(locale, "dashboard.public")
                                : t(locale, "dashboard.private")}
                            </span>
                          </Badge>
                            <QuizOptionsMenu
                            quizId={quiz.id}
                            quizName={quiz.name}
                            visibility={quiz.visibility}
                            onDeleted={refreshCurrentPage}
                            onDuplicated={refreshCurrentPage}
                            onEdit={() => handleEdit(quiz.id)}
                          />
                        </div>
                        {quiz.visibility === "PUBLIC" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => handlePlay(quiz.id)}
                            disabled={playLoadingQuizId !== null}
                          >
                            {playLoadingQuizId === quiz.id ? (
                              t(locale, "common.loading")
                            ) : (
                              <>
                                <Play className="h-4 w-4" />
                                {t(locale, "publicQuizzes.play")}
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
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
