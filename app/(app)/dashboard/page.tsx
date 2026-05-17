"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Coins,
  Sparkles,
  Plus,
  Copy,
  Play,
  BarChart3,
  MessageSquare,
  Users,
  Edit,
  Eye,
} from "lucide-react";

import { getDashboardStats } from "@/app/(app)/dashboard/actions";
import { createOrGetQuizLink } from "@/app/quiz-link/actions";
import { BuilderLocalDraftCard } from "@/components/builder/BuilderLocalDraftCard";
import {
  CreateManualServerDraftButton,
  CreateManualServerDraftSurfaceButton,
} from "@/components/dashboard/create-manual-server-draft-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { QuizStatusBadge } from "@/components/quiz/quiz-status-badge";
import { PARTICIPANT_INVITED } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { buildCommonEventProps } from "@/lib/analytics/props";
import {
  resolveDashboardWelcomeGreetingKey,
  type DashboardWelcomeGreetingKey,
} from "@/lib/dashboardWelcomeGreeting";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import { resolveQuizActionError } from "@/lib/quiz/resolveQuizActionError";
import {
  canQuizBePlayed,
  canQuizBeShared,
  canQuizShowResponseInsights,
} from "@/lib/quiz/quizStatusPolicy";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

const noopSubscribe = (): (() => void) => () => {};

function getWelcomeGreetingClientSnapshot(): DashboardWelcomeGreetingKey {
  return resolveDashboardWelcomeGreetingKey();
}

function getWelcomeGreetingServerSnapshot(): DashboardWelcomeGreetingKey {
  return "dashboard.welcome.titleGreetingMorning";
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: (delay = 0) => ({ delay, duration: 0.4 }),
};

type DashboardStats = {
  coinBalance: number;
  quizCount: number;
  recentQuizzes: Array<{
    id: string;
    name: string;
    status: QuizLifecycleStatus;
    publishedAt: string | null;
    questionCount: number;
    attemptCount: number;
  }>;
  serverDraftQuizIds: string[];
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playLoadingQuizId, setPlayLoadingQuizId] = useState<string | null>(null);
  const [copyLoadingQuizId, setCopyLoadingQuizId] = useState<string | null>(null);
  const [copiedQuizId, setCopiedQuizId] = useState<string | null>(null);
  const getResponseLabel = (count: number) =>
    count <= 1
      ? t(locale, "dashboard.responseSingular")
      : t(locale, "dashboard.responsesPlural");

  const welcomeGreetingKey = useSyncExternalStore(
    noopSubscribe,
    getWelcomeGreetingClientSnapshot,
    getWelcomeGreetingServerSnapshot
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

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <motion.div
          initial={fadeIn.initial}
          animate={fadeIn.animate}
          transition={fadeIn.transition(0)}
        >
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {t(locale, welcomeGreetingKey)}
            <span className="text-primary capitalize">{name}</span>
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            {t(
              locale,
              showOnboarding
                ? "dashboard.home.onboardingWelcomeSubtitle"
                : "dashboard.home.subtitle"
            )}
          </p>
        </motion.div>

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

        {isLoading && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-8 max-w-md animate-pulse rounded-lg bg-muted" />
              <div className="h-4 max-w-sm animate-pulse rounded bg-muted/70" />
            </div>
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="h-6 max-w-xs animate-pulse rounded bg-muted" />
                <div className="h-4 w-full max-w-lg animate-pulse rounded bg-muted/60" />
                <div className="h-11 max-w-md animate-pulse rounded-2xl bg-muted" />
              </CardContent>
            </Card>
          </div>
        )}

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

        {showStandardDashboard && (
          <>
            <motion.div
              initial={fadeIn.initial}
              animate={fadeIn.animate}
              transition={fadeIn.transition(0.1)}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Link href="/generate" className="block">
                  <Card className="group border-2 transition-all hover:border-blue/30">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue/10">
                        <Sparkles className="h-5 w-5 text-blue" />
                      </div>
                      <p className="font-medium text-foreground">
                        {t(locale, "dashboard.home.ctaCreateWithAi")}
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <CreateManualServerDraftSurfaceButton>
                  <Card className="group border-2 transition-all hover:border-primary/30">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Plus className="h-5 w-5 text-primary" />
                      </div>
                      <p className="font-medium text-foreground">
                        {t(locale, "dashboard.home.ctaCreateManually")}
                      </p>
                    </CardContent>
                  </Card>
                </CreateManualServerDraftSurfaceButton>

                <Link href="/dashboard/quizzes" className="block">
                  <Card className="group border-2 transition-all hover:border-blue/30">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue/10">
                        <FileText className="h-5 w-5 text-blue" />
                      </div>
                      <p className="font-medium text-foreground">
                        {t(locale, "dashboard.home.ctaSeeMyQuizzes")}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={fadeIn.initial}
              animate={fadeIn.animate}
              transition={fadeIn.transition(0.2)}
            >
              <Card className="border border-border/70 lg:hidden">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <Coins className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {displayStats.coinBalance}{" "}
                        {t(locale, "account.coins.coins")}
                      </p>
                      <p className="text-base text-muted-foreground">
                        {t(locale, "dashboard.home.coinsDescription")}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/account/coins"
                    className="text-base font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {t(locale, "dashboard.home.manageCoins")}
                  </Link>
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 sm:gap-5">
              {stats.recentQuizzes.map((quiz, index) => {
                const isDraft = quiz.status === "DRAFT";
                const isArchived = quiz.status === "ARCHIVED";
                const titleHref = isDraft
                  ? `/builder/${quiz.id}`
                  : `/dashboard/quiz/${quiz.id}?tab=questions`;

                return (
                <motion.div
                  key={quiz.id}
                  initial={fadeIn.initial}
                  animate={fadeIn.animate}
                  transition={fadeIn.transition(0.35 + index * 0.06)}
                >
                  <Card
                    className="group flex h-full flex-col"
                  >
                    <CardContent className="flex flex-1 flex-col p-5">
                      <Link
                        href={titleHref}
                        className="mb-4 block flex-1"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="line-clamp-2 flex-1 min-w-0 text-lg font-medium leading-snug text-foreground transition-colors hover:text-blue">
                            {quiz.name}
                          </h3>
                          <QuizStatusBadge status={quiz.status} locale={locale} />
                        </div>
                      </Link>

                      <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {quiz.questionCount}{" "}
                          {quiz.questionCount === 1
                            ? t(locale, "dashboard.question")
                            : t(locale, "dashboard.questions")}
                        </span>
                        {canQuizShowResponseInsights(quiz.status) ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            {quiz.attemptCount} {getResponseLabel(quiz.attemptCount)}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-auto space-y-3 border-t border-border/60 pt-3">
                        {canQuizBePlayed(quiz.status) ? (
                          <Button
                            variant="blue"
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => handlePlay(quiz.id)}
                            disabled={playLoadingQuizId !== null}
                          >
                            <Play className="h-4 w-4" />
                            {playLoadingQuizId === quiz.id
                              ? t(locale, "common.loading")
                              : t(locale, "dashboard.playQuiz")}
                          </Button>
                        ) : null}

                        {isDraft ? (
                          <>
                            <Button
                              variant="outlineBlue"
                              size="sm"
                              className="w-full gap-2"
                              asChild
                            >
                              <Link href={`/builder/${quiz.id}`}>
                                <Edit className="h-4 w-4" />
                                {t(locale, "dashboard.continueInBuilder")}
                              </Link>
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              {t(locale, "dashboard.draftFinishToShareHint")}
                            </p>
                          </>
                        ) : null}

                        {isArchived ? (
                          <Button
                            variant="blue"
                            size="sm"
                            className="w-full gap-2"
                            asChild
                          >
                            <Link href={`/dashboard/quiz/${quiz.id}?tab=questions`}>
                              <Eye className="h-4 w-4" />
                              {t(locale, "dashboard.viewArchivedQuiz")}
                            </Link>
                          </Button>
                        ) : null}

                        {canQuizBeShared(quiz.status) ? (
                          <Button
                            variant={
                              copiedQuizId === quiz.id ? "secondary" : "outline"
                            }
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
                                  {locale === "fr"
                                    ? "Copier le lien"
                                    : "Copy link"}
                                </span>
                              </>
                            )}
                          </Button>
                        ) : null}

                        {canQuizShowResponseInsights(quiz.status) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            asChild
                          >
                            <Link
                              href={`/dashboard/quiz/${quiz.id}?tab=results`}
                              className="flex w-full items-center justify-center gap-2"
                            >
                              <BarChart3 className="h-4 w-4" />
                              {t(locale, "dashboard.quizTabResults")}
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
