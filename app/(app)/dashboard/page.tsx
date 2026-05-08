"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboardStats } from "@/app/(app)/dashboard/actions";
import { createOrGetQuizLink } from "@/app/quiz-link/actions";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics/track";
import { PARTICIPANT_INVITED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";

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
    questionCount: number;
    attemptCount: number;
  }>;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playLoadingQuizId, setPlayLoadingQuizId] = useState<string | null>(null);
  const [copyLoadingQuizId, setCopyLoadingQuizId] = useState<string | null>(null);
  const [copiedQuizId, setCopiedQuizId] = useState<string | null>(null);

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

  const displayStats: DashboardStats | null = stats ?? {
    coinBalance: 0,
    quizCount: 0,
    recentQuizzes: [],
  };

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";

  const getShareUrl = async (quizId: string): Promise<string | null> => {
    const result = await createOrGetQuizLink(quizId, true);
    if (!result.success || !baseUrl) {
      showToast(result.success ? t(locale, "dashboard.shareError") : result.error, "error");
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
      await navigator.clipboard.writeText(shareUrl);
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
      const shareUrl = await getShareUrl(quizId);
      if (shareUrl) {
        window.open(shareUrl, "_blank", "noopener,noreferrer");
      }
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
            {t(locale, "dashboard.welcome.titleGreeting")}
            <span className="text-primary capitalize">{name}</span>
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            {t(locale, "dashboard.home.subtitle")}
          </p>
        </motion.div>

        {/* Primary actions */}
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
                  <p className="font-bold text-foreground">
                    {t(locale, "dashboard.home.ctaCreateWithAi")}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/builder" className="block">
              <Card className="group border-2 transition-all hover:border-primary/30">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-bold text-foreground">
                    {t(locale, "dashboard.home.ctaCreateManually")}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/quizzes" className="block">
              <Card className="group border-2 transition-all hover:border-blue/30">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue/10">
                    <FileText className="h-5 w-5 text-blue" />
                  </div>
                  <p className="font-bold text-foreground">
                    {t(locale, "dashboard.home.ctaSeeMyQuizzes")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>

        {/* Coins block (secondary) */}
        {!isLoading && (
          <motion.div
            initial={fadeIn.initial}
            animate={fadeIn.animate}
            transition={fadeIn.transition(0.2)}
          >
            <Card className="border border-border/70">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {displayStats.coinBalance} {t(locale, "account.coins.coins")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t(locale, "dashboard.home.coinsDescription")}
                    </p>
                  </div>
                </div>
                <Link
                  href="/account/coins"
                  className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {t(locale, "dashboard.home.manageCoins")}
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent quizzes */}
        {!isLoading && stats && stats.recentQuizzes.length > 0 && (
          <motion.div
            initial={fadeIn.initial}
            animate={fadeIn.animate}
            transition={fadeIn.transition(0.3)}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-foreground">
                {t(locale, "dashboard.home.recentQuizzesTitle")}
              </h2>
              <Link
                href="/dashboard/quizzes"
                className="text-sm font-semibold text-blue hover:underline"
              >
                {t(locale, "dashboard.home.seeAll")}
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 sm:gap-5">
              {stats.recentQuizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={fadeIn.initial}
                  animate={fadeIn.animate}
                  transition={fadeIn.transition(0.35 + index * 0.06)}
                >
                  <Card variant="playful" className="group flex h-full flex-col">
                    <CardContent className="flex flex-1 flex-col p-5">
                      <Link
                        href={`/dashboard/quiz/${quiz.id}/preview`}
                        className="mb-4 block flex-1"
                      >
                        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-foreground transition-colors hover:text-blue">
                          {quiz.name}
                        </h3>
                      </Link>

                      <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {quiz.questionCount}{" "}
                          {quiz.questionCount === 1
                            ? t(locale, "dashboard.question")
                            : t(locale, "dashboard.questions")}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {quiz.attemptCount} {t(locale, "dashboard.attempts")}
                        </span>
                      </div>

                      <div className="mt-auto space-y-2 border-t border-border/60 pt-3">
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
                            : t(locale, "dashboard.home.testQuiz")}
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant={copiedQuizId === quiz.id ? "secondary" : "outline"}
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => handleCopyLink(quiz.id)}
                            disabled={copyLoadingQuizId !== null}
                          >
                            <Copy className="h-4 w-4" />
                            {copyLoadingQuizId === quiz.id
                              ? t(locale, "common.loading")
                              : copiedQuizId === quiz.id
                                ? t(locale, "dashboard.linkCopied")
                                : (
                                  <>
                                    <span className="sm:hidden">
                                      {locale === "fr" ? "Lien" : "Link"}
                                    </span>
                                    <span className="hidden sm:inline">
                                      {locale === "fr" ? "Copier le lien" : "Copy link"}
                                    </span>
                                  </>
                                )}
                          </Button>

                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/quiz/${quiz.id}`} className="gap-2">
                              <BarChart3 className="h-4 w-4" />
                              {t(locale, "dashboard.results")}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && displayStats.quizCount === 0 && (
          <motion.div
            initial={fadeIn.initial}
            animate={fadeIn.animate}
            transition={fadeIn.transition(0.4)}
          >
            <Card className="border-none">
              <CardContent className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <h3 className="mb-1 text-lg font-black">
                  {t(locale, "dashboard.home.emptyTitle")}
                </h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  {t(locale, "dashboard.home.emptyDescription")}
                </p>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <Button variant="outline" asChild>
                    <Link href="/generate" className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      {t(locale, "dashboard.home.ctaCreateWithAi")}
                    </Link>
                  </Button>
                  <Button variant="primary" asChild>
                    <Link href="/builder" className="gap-2">
                      <Plus className="h-4 w-4" />
                      {t(locale, "dashboard.home.ctaCreateManually")}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <Card key={item}>
                <CardContent className="space-y-3 p-4">
                  <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted/60" />
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="h-9 animate-pulse rounded bg-muted" />
                    <div className="h-9 animate-pulse rounded bg-muted" />
                    <div className="h-9 animate-pulse rounded bg-muted" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
