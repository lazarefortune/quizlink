"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Plus } from "lucide-react";

import { QuizListCard, type QuizListCardData } from "@/components/dashboard/quiz-list-card";
import { getDashboardStats, deleteQuiz } from "@/app/(app)/dashboard/actions";
import { createOrGetQuizLink } from "@/app/quiz-link/actions";
import { BuilderLocalDraftCard } from "@/components/builder/BuilderLocalDraftCard";
import { CreateManualServerDraftButton } from "@/components/dashboard/create-manual-server-draft-button";
import {
  DashboardWelcomeBanner,
  DashboardWelcomeBannerSkeleton,
} from "@/components/dashboard/DashboardWelcomeBanner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
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
import { PARTICIPANT_INVITED } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { buildCommonEventProps } from "@/lib/analytics/props";
import {
  resolveDashboardWelcomeGreetingKey,
} from "@/lib/dashboardWelcomeGreeting";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import { useTimeZone } from "@/lib/date-time/timezone-provider";
import { resolveQuizActionError } from "@/lib/quiz/resolveQuizActionError";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: (delay = 0) => ({ delay, duration: 0.4 }),
};

type DashboardStats = {
  coinBalance: number;
  quizCount: number;
  recentQuizzes: QuizListCardData[];
  serverDraftQuizIds: string[];
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { locale } = useLocale();
  const { timeZone } = useTimeZone();
  const { showToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playLoadingQuizId, setPlayLoadingQuizId] = useState<string | null>(null);
  const [copyLoadingQuizId, setCopyLoadingQuizId] = useState<string | null>(null);
  const [quizPendingDelete, setQuizPendingDelete] = useState<QuizListCardData | null>(null);
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);
  const welcomeGreetingKey = useMemo(
    () => resolveDashboardWelcomeGreetingKey(new Date(), timeZone),
    [timeZone],
  );

  const name =
    session?.user?.name?.split(" ")[0] ||
    session?.user?.email ||
    (locale === "fr" ? "tu" : "you");

  useEffect(() => {
    getDashboardStats()
      .then((result) => {
        if (result.success) {
          setStats(result.stats);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const displayStats: DashboardStats = stats ?? {
    coinBalance: 0,
    quizCount: 0,
    recentQuizzes: [],
    serverDraftQuizIds: [],
  };

  const showOnboarding = !isLoading && stats !== null && stats.quizCount === 0;
  const showStandardDashboard = !isLoading && !showOnboarding;

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";

  const getShareUrl = async (quizId: string): Promise<string | null> => {
    const result = await createOrGetQuizLink(quizId, true);
    if (!result.success) {
      showToast(resolveQuizActionError(locale, result.error), "error");
      return null;
    }
    if (!baseUrl) {
      showToast(t(locale, "dashboard.shareError"), "error");
      return null;
    }

    track(PARTICIPANT_INVITED, {
      ...buildCommonEventProps({ isLoggedIn: true, preferredLanguage: locale }),
      quiz_id: quizId,
      delivery: "link",
      is_first_invite_for_quiz: result.isFirstInviteForQuiz,
    });

    return `${baseUrl}/quiz/${result.quizLink.token}`;
  };

  const handleCopyLink = async (quizId: string) => {
    setCopyLoadingQuizId(quizId);
    try {
      const shareUrl = await getShareUrl(quizId);
      if (!shareUrl) return;
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
      showToast(t(locale, "dashboard.linkCopied"), "success");
    } catch (error) {
      console.error("Error copying quiz link:", error);
      showToast(t(locale, "dashboard.shareError"), "error");
    } finally {
      setCopyLoadingQuizId(null);
    }
  };

  const handlePlay = async (quizId: string) => {
    setPlayLoadingQuizId(quizId);
    try {
      const result = await createOrGetQuizLink(quizId, true);
      if (result.success) {
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

  const handleEdit = (quizId: string) => {
    router.push(`/builder/${quizId}`);
  };

  const handleOpenQuizPreview = (quizId: string) => {
    router.push(`/dashboard/quiz/${quizId}?tab=questions`);
  };

  const handleDeleteQuiz = async () => {
    if (!quizPendingDelete) return;

    setIsDeletingQuiz(true);
    try {
      const result = await deleteQuiz(quizPendingDelete.id);
      if (result.success) {
        showToast(t(locale, "dashboard.quizDeletedSuccess"), "success");
        setQuizPendingDelete(null);
        const refreshed = await getDashboardStats();
        if (refreshed.success) {
          setStats(refreshed.stats);
        }
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

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="space-y-6 sm:space-y-8">
        {isLoading ? (
          <DashboardWelcomeBannerSkeleton />
        ) : (
          <motion.div
            initial={fadeIn.initial}
            animate={fadeIn.animate}
            transition={fadeIn.transition(0)}
          >
            <DashboardWelcomeBanner
              name={name}
              welcomeGreetingKey={welcomeGreetingKey}
              subtitle={t(
                locale,
                showOnboarding
                  ? "dashboard.home.onboardingWelcomeSubtitle"
                  : "dashboard.home.subtitle",
              )}
              locale={locale}
            />
          </motion.div>
        )}

        {session?.user?.id ? (
          <motion.div
            initial={fadeIn.initial}
            animate={fadeIn.animate}
            transition={fadeIn.transition(0.05)}
          >
            <BuilderLocalDraftCard
              userId={session.user.id}
              serverDraftQuizIds={displayStats.serverDraftQuizIds}
            />
          </motion.div>
        ) : null}

        {showOnboarding && (
          <>
            <motion.div
              initial={fadeIn.initial}
              animate={fadeIn.animate}
              transition={fadeIn.transition(0.15)}
              className="mx-auto w-full max-w-lg"
            >
              <Card className="border-2 border-border bg-card shadow-sm">
                <CardContent className="flex flex-col items-center px-4 py-10 text-center sm:px-8">
                  <h2 className="mb-2 text-xl font-black tracking-tight text-foreground sm:text-2xl">
                    {t(locale, "dashboard.home.onboardingTitle")}
                  </h2>
                  <p className="mb-8 max-w-md text-sm text-muted-foreground sm:text-base">
                    {t(locale, "dashboard.home.onboardingDescription")}
                  </p>
                  <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button variant="primary" asChild className="w-full sm:w-auto">
                      <Link href="/generate" className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        {t(locale, "dashboard.home.ctaCreateWithAi")}
                      </Link>
                    </Button>
                    <CreateManualServerDraftButton
                      variant="outline"
                      className="w-full sm:w-auto gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {t(locale, "dashboard.home.ctaCreateManually")}
                    </CreateManualServerDraftButton>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {/* Recent quizzes */}
        {showStandardDashboard && stats && stats.recentQuizzes.length > 0 && (
          <motion.div
            initial={fadeIn.initial}
            animate={fadeIn.animate}
            transition={fadeIn.transition(0.3)}
          >
            <div className="mb-4 flex gap-2 flex-row items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                {t(locale, "dashboard.home.recentQuizzesTitle")}
              </h2>
              <Link
                href="/dashboard/quizzes"
                className="text-base font-semibold text-blue hover:underline"
              >
                {t(locale, "dashboard.home.seeAll")}
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 2xl:grid-cols-4">
              {stats.recentQuizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={fadeIn.initial}
                  animate={fadeIn.animate}
                  transition={fadeIn.transition(0.35 + index * 0.06)}
                >
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
          </motion.div>
        )}
      </div>
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
