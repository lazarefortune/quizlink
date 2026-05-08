"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Copy, Play } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import type { QuizContentQuestion } from "./actions";
import { QuizStatsTab } from "./quiz-stats-tab";
import { createOrGetQuizLink } from "@/app/quiz-link/actions";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics/track";
import { PARTICIPANT_INVITED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";

type QuizDetailContentProps = {
  quizId: string;
  quizName: string;
  visibility: string;
  questions: QuizContentQuestion[];
  stats: {
    totalQuestions: number;
    enrolledParticipantsCount: number;
    participants: Array<{
      id: string;
      name: string;
      email: string | null;
      attemptsCount: number;
      lastScore: number | null;
      lastAttemptDate: Date | null;
    }>;
    anonymousAttemptsCount: number;
    attempts: Array<{
      id: string;
      participantName: string;
      isAnonymous: boolean;
      score: number | null;
      duration: number | null;
      status: string;
      startedAt: Date;
      finishedAt: Date | null;
    }>;
  };
};

export function QuizDetailContent({
  quizId,
  quizName,
  visibility: _visibility,
  questions,
  stats,
}: QuizDetailContentProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const [playLoading, setPlayLoading] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);
  const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
  const getDisplayStatus = (status: string, startedAt: Date | null): string => {
    if (status !== "IN_PROGRESS" || !startedAt) return status;
    const elapsed = Date.now() - new Date(startedAt).getTime();
    return elapsed >= FOUR_HOURS_MS ? "ABANDONED" : status;
  };

  const attemptsWithDisplayStatus = stats.attempts.map((attempt) => ({
    ...attempt,
    displayStatus: getDisplayStatus(attempt.status, attempt.startedAt),
  }));
  const totalResults = attemptsWithDisplayStatus.length;
  const completedResults = attemptsWithDisplayStatus.filter(
    (attempt) => attempt.displayStatus === "COMPLETED",
  ).length;
  const abandonedResults = attemptsWithDisplayStatus.filter(
    (attempt) => attempt.displayStatus === "ABANDONED",
  ).length;
  const bestScore = stats.attempts
    .filter((attempt) => attempt.score != null)
    .reduce<number | null>((max, attempt) => {
      if (attempt.score == null) return max;
      if (max == null) return attempt.score;
      return attempt.score > max ? attempt.score : max;
    }, null);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";

  const getShareUrl = async (): Promise<string | null> => {
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

  const handlePlay = async () => {
    setPlayLoading(true);
    try {
      const shareUrl = await getShareUrl();
      if (shareUrl) {
        window.open(shareUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setPlayLoading(false);
    }
  };

  const handleCopyLink = async () => {
    setCopyLoading(true);
    try {
      const shareUrl = await getShareUrl();
      if (!shareUrl) return;
      await navigator.clipboard.writeText(shareUrl);
      showToast(t(locale, "dashboard.linkCopied"), "success");
    } catch (error) {
      console.error("Error copying quiz link:", error);
      showToast(t(locale, "dashboard.shareError"), "error");
    } finally {
      setCopyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Link href="/dashboard/quizzes">
                <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t(locale, "dashboard.backToMyQuizzes")}
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{quizName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    {questions.length}{" "}
                    {questions.length === 1
                      ? t(locale, "dashboard.question")
                      : t(locale, "dashboard.questions")}
                  </span>
                  <span>
                    {totalResults}{" "}
                    {totalResults <= 1
                      ? t(locale, "dashboard.resultSingular")
                      : t(locale, "dashboard.resultsPlural")}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleCopyLink}
                disabled={copyLoading}
              >
                <Copy className="h-4 w-4" />
                {copyLoading ? t(locale, "common.loading") : t(locale, "dashboard.copyLink")}
              </Button>
              <Button
                variant="blue"
                size="sm"
                className="gap-2"
                onClick={handlePlay}
                disabled={playLoading}
              >
                <Play className="h-4 w-4" />
                {playLoading ? t(locale, "common.loading") : t(locale, "dashboard.testQuiz")}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => router.push(`/builder/${quizId}`)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                {t(locale, "dashboard.editQuiz")}
              </Button>
            </div>
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(locale, "dashboard.resultsLabel")}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{totalResults}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(locale, "dashboard.resultsCompleted")}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{completedResults}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(locale, "dashboard.resultsAbandoned")}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{abandonedResults}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(locale, "dashboard.bestScoreLabel")}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {bestScore != null ? `${bestScore.toFixed(1)}%` : "-"}
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            {t(locale, "dashboard.quizResultsTitle")}
          </h2>
          <QuizStatsTab
            quizId={quizId}
            quizName={quizName}
            stats={stats}
            onCopyLink={handleCopyLink}
            isCopyLoading={copyLoading}
          />
        </section>
      </div>
    </div>
  );
}
