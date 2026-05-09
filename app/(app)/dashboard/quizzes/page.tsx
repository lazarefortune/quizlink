"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getUserQuizzesPaginated,
  type UserQuizListItem,
} from "@/app/(app)/builder/actions";
import { deleteQuiz } from "@/app/(app)/dashboard/actions";
import { useLocale } from "@/lib/i18n/use-locale";
import { t, type Locale } from "@/lib/i18n";
import {
  Plus,
  FileText,
  Sparkles,
  FileQuestion,
  Users,
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight,
  Play,
  Copy,
  BarChart3,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { createOrGetQuizLink } from "@/app/quiz-link/actions";
import { track } from "@/lib/analytics/track";
import { PARTICIPANT_INVITED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
                <p className="text-sm font-black font-fredoka">
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
                <p className="text-sm font-black font-fredoka">
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
  const { showToast } = useToast();
  const [quizzes, setQuizzes] = useState<UserQuizListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [playLoadingQuizId, setPlayLoadingQuizId] = useState<string | null>(null);
  const [copyLoadingQuizId, setCopyLoadingQuizId] = useState<string | null>(null);
  const [copiedQuizId, setCopiedQuizId] = useState<string | null>(null);
  const [quizPendingDelete, setQuizPendingDelete] = useState<UserQuizListItem | null>(
    null,
  );
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);

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

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  };

  const handleEdit = (quizId: string) => {
    router.push(`/builder/${quizId}`);
  };

  const handleOpenQuizDetails = (quizId: string) => {
    router.push(`/dashboard/quiz/${quizId}`);
  };

  const handleOpenQuizPreview = (quizId: string) => {
    router.push(`/dashboard/quiz/${quizId}/preview`);
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
      if (result.success) {
        track(PARTICIPANT_INVITED, {
          ...buildCommonEventProps({ isLoggedIn: true, preferredLanguage: locale }),
          quiz_id: quizId,
          delivery: "link",
          is_first_invite_for_quiz: result.isFirstInviteForQuiz,
        });
        router.push(`/quiz/${result.quizLink.token}`);
      } else {
        showToast(result.error || t(locale, "dashboard.shareError"), "error");
      }
    } catch (error) {
      console.error("Error getting quiz link:", error);
      showToast(t(locale, "dashboard.shareError"), "error");
    } finally {
      setPlayLoadingQuizId(null);
    }
  };

  const handleCopyLink = async (quizId: string) => {
    setCopyLoadingQuizId(quizId);
    try {
      const result = await createOrGetQuizLink(quizId, true);
      if (!result.success) {
        showToast(result.error || t(locale, "dashboard.shareError"), "error");
        return;
      }
      const shareUrl = `${baseUrl}/quiz/${result.quizLink.token}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        // Fallback for browsers where clipboard API is unavailable after async
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
      setCopiedQuizId(quizId);
      setTimeout(() => setCopiedQuizId(null), 2000);
      showToast(t(locale, "dashboard.linkCopied"), "success");
    } catch (error) {
      console.error("Error copying quiz link:", error);
      showToast(t(locale, "dashboard.shareError"), "error");
    } finally {
      setCopyLoadingQuizId(null);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
              {quizzes.map((quiz, i) => (
                <motion.div key={quiz.id} custom={i + 1} variants={fadeUp}>
                  <Card
                    className="group flex flex-col h-full"
                  >
                    <CardContent className="flex flex-col flex-1 p-5">
                      <Link
                        href={`/dashboard/quiz/${quiz.id}/preview`}
                        className="block flex-1 mb-4"
                      >
                        <h3 className="text-lg font-bold leading-snug line-clamp-2 wrap-break-word text-foreground transition-colors hover:text-blue">
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

                      <p className="mb-3 text-xs text-muted-foreground">
                        {t(locale, "dashboard.createdOn")}{" "}
                        {new Date(quiz.createdAt).toLocaleDateString(
                          locale === "fr" ? "fr-FR" : "en-US",
                        )}
                      </p>

                      <div className="mt-auto pt-3 border-t border-border/60 space-y-5">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="blue"
                            size="sm"
                            className="flex-1 gap-2"
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                aria-label={t(locale, "dashboard.actionsLabel")}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                onClick={() => handleOpenQuizPreview(quiz.id)}
                                className="gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                {locale === "fr" ? "Voir le quiz" : "View quiz"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEdit(quiz.id)}
                                className="gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                {t(locale, "dashboard.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setQuizPendingDelete(quiz)}
                                className="gap-2 text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                {t(locale, "dashboard.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant={copiedQuizId === quiz.id ? "secondary" : "outline"}
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => handleCopyLink(quiz.id)}
                            disabled={copyLoadingQuizId !== null}
                          >
                            <Copy className="h-4 w-4" />
                            {copyLoadingQuizId === quiz.id ? (
                              t(locale, "common.loading")
                            ) : copiedQuizId === quiz.id ? (
                              t(locale, "dashboard.linkCopied")
                            ) : (
                              <>
                                <span className="sm:hidden">
                                  {locale === "fr" ? "Lien" : "Link"}
                                </span>
                                <span className="hidden sm:inline">
                                  {t(locale, "dashboard.copyLink")}
                                </span>
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => handleOpenQuizDetails(quiz.id)}
                          >
                            <BarChart3 className="h-4 w-4" />
                            {t(locale, "dashboard.results")}
                          </Button>
                        </div>
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingQuiz ? t(locale, "common.loading") : t(locale, "dashboard.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
