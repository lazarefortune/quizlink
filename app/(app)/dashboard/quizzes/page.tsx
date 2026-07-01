"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  getUserQuizzesPaginated,
  type UserQuizListItem,
} from "@/app/(app)/builder/actions";
import { CreateQuizModalTrigger } from "@/components/dashboard/create-quiz-modal-trigger";
import { deleteQuiz } from "@/app/(app)/dashboard/actions";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { resolveQuizActionError } from "@/lib/quiz/resolveQuizActionError";
import {
  FileQuestion,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { createOrGetQuizLink } from "@/app/quiz-link/actions";
import { QuizListCard } from "@/components/dashboard/quiz-list-card";
import { DashboardCreateNavIcon } from "@/components/dashboard/dashboard-nav-icons";
import { track } from "@/lib/analytics/track";
import { PARTICIPANT_INVITED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
const PAGE_SIZE = 12;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35 },
  }),
};

export default function DashboardQuizzesPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const [quizzes, setQuizzes] = useState<UserQuizListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [playLoadingQuizId, setPlayLoadingQuizId] = useState<string | null>(null);
  const [copyLoadingQuizId, setCopyLoadingQuizId] = useState<string | null>(null);
  const [quizPendingDelete, setQuizPendingDelete] = useState<UserQuizListItem | null>(
    null,
  );
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const loadQuizzes = useCallback(
    async (p: number, search: string, options?: { setLoading?: boolean }) => {
      const shouldSetLoading = options?.setLoading ?? true;
      if (shouldSetLoading) {
        setIsLoading(true);
      }
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
    },
    [],
  );

  useEffect(() => {
    let isCancelled = false;

    async function fetchQuizzes() {
      try {
        const result = await getUserQuizzesPaginated(
          page,
          PAGE_SIZE,
          searchQuery || undefined,
        );
        if (isCancelled) return;
        if (result.success) {
          setQuizzes(result.quizzes);
          setTotal(result.total);
        } else {
          console.error("Failed to load quizzes:", result.error);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Error loading quizzes:", error);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchQuizzes();

    return () => {
      isCancelled = true;
    };
  }, [page, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSearchQuery(searchInput.trim());
    setPage(1);
  };

  const handleClearSearch = () => {
    setIsLoading(true);
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  };

  const handleEdit = (quizId: string) => {
    router.push(`/builder/${quizId}`);
  };

  const handleOpenQuizPreview = (quizId: string) => {
    router.push(`/dashboard/quiz/${quizId}?tab=questions`);
  };

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";

  const handleCopyLink = async (quizId: string) => {
    setCopyLoadingQuizId(quizId);
    try {
      const result = await createOrGetQuizLink(quizId, true);
      if (!result.success) {
        showToast(resolveQuizActionError(locale, result.error), "error");
        return;
      }
      if (!baseUrl) {
        showToast(t(locale, "dashboard.shareError"), "error");
        return;
      }

      track(PARTICIPANT_INVITED, {
        ...buildCommonEventProps({ isLoggedIn: true, preferredLanguage: locale }),
        quiz_id: quizId,
        delivery: "link",
        is_first_invite_for_quiz: result.isFirstInviteForQuiz,
      });

      const shareUrl = `${baseUrl}/quiz/${result.quizLink.token}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      showToast(t(locale, "dashboard.linkCopied"), "success");
    } catch (error) {
      console.error("Error copying quiz link:", error);
      showToast(t(locale, "dashboard.shareError"), "error");
    } finally {
      setCopyLoadingQuizId(null);
    }
  };

  const refreshCurrentPage = () => {
    loadQuizzes(page, searchQuery);
  };

  const handlePlay = async (quizId: string) => {
    setPlayLoadingQuizId(quizId);
    try {
      const result = await createOrGetQuizLink(quizId, true);
      if (result.success) {
        track(PARTICIPANT_INVITED, {
          ...buildCommonEventProps({ isLoggedIn: true, preferredLanguage: locale }),
          quiz_id: quizId,
          delivery: "link",
          is_first_invite_for_quiz: result.isFirstInviteForQuiz,
        });
        router.push(`/quiz/${result.quizLink.token}`);
      } else {
        showToast(
          resolveQuizActionError(locale, result.error) ||
            t(locale, "dashboard.shareError"),
          "error",
        );
      }
    } catch (error) {
      console.error("Error getting quiz link:", error);
      showToast(t(locale, "dashboard.shareError"), "error");
    } finally {
      setPlayLoadingQuizId(null);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quizPendingDelete) return;

    setIsDeletingQuiz(true);
    try {
      const result = await deleteQuiz(quizPendingDelete.id);
      if (result.success) {
        showToast(t(locale, "dashboard.quizDeletedSuccess"), "success");
        setQuizPendingDelete(null);
        refreshCurrentPage();
      } else {
        showToast(result.error || t(locale, "dashboard.deleteError"), "error");
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      showToast(t(locale, "dashboard.deleteError"), "error");
    } finally {
      setIsDeletingQuiz(false);
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
          <div className="flex gap-2 flex-row items-center justify-between mb-3">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-black text-foreground sm:text-3xl">
                {t(locale, "dashboard.title")}
              </h2>
            </div>
            {quizzes.length > 0 && (
            <div className="shrink-0">
              <CreateQuizModalTrigger locale={locale} />
            </div>
            )}
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
                className="pl-9 pr-9"
                aria-label={t(locale, "common.search")}
              />
              {searchInput.trim().length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={locale === "fr" ? "Effacer la recherche" : "Clear search"}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="submit" variant="secondary" size="default">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </motion.div>

        {/* Empty state */}
        {quizzes.length === 0 ? (
          <motion.div custom={1} variants={fadeUp}>
            <Card className="border-none">
              <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                  {searchQuery ? (
                    <Search className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <FileQuestion className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-lg font-black mb-1">
                  {searchQuery
                    ? t(locale, "dashboard.noSearchResults")
                    : t(locale, "dashboard.noQuizzes")}
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                  {searchQuery
                    ? (locale === "fr"
                        ? "Modifie ta recherche ou réessaie avec d'autres mots."
                        : "Try different search terms or clear the search.")
                    : (locale === "fr"
                        ? "Crée ton premier quiz manuellement ou avec l'IA pour commencer."
                        : "Create your first quiz manually or with AI to get started.")}
                </p>
                {!searchQuery && (
                  <CreateQuizModalTrigger
                    locale={locale}
                    variant="primary"
                    size="default"
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 2xl:grid-cols-4">
              {quizzes.map((quiz, i) => (
                <motion.div key={quiz.id} custom={i + 1} variants={fadeUp}>
                  <QuizListCard
                    quiz={quiz}
                    locale={locale}
                    playLoadingQuizId={playLoadingQuizId}
                    copyLoadingQuizId={copyLoadingQuizId}
                    onPlay={handlePlay}
                    onCopyLink={handleCopyLink}
                    onEdit={handleEdit}
                    onView={handleOpenQuizPreview}
                    onDelete={() => setQuizPendingDelete(quiz)}
                  />
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsLoading(true);
                    setPage((p) => Math.max(1, p - 1));
                  }}
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
                  onClick={() => {
                    setIsLoading(true);
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
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
      <AlertDialog
        open={quizPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletingQuiz) {
            setQuizPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent onOverlayClick={() => !isDeletingQuiz && setQuizPendingDelete(null)}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(locale, "dashboard.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(locale, "dashboard.deleteConfirmDescription", {
                name: quizPendingDelete?.name ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingQuiz}>
              {t(locale, "common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuiz}
              disabled={isDeletingQuiz}
              className={buttonVariants({ variant: "destructive" })}
            >
              {isDeletingQuiz ? t(locale, "common.loading") : t(locale, "dashboard.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
