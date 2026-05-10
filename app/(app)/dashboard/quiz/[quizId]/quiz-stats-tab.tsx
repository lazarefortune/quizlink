"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  ListChecks,
  Copy,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { formatScoreFraction } from "@/lib/formatScore";
import { cn } from "@/lib/utils";
import { FormattedDate } from "@/components/ui/formatted-date";
import { getAttemptDetails } from "./actions";

type Stats = {
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

type QuizStatsTabProps = {
  quizId: string;
  quizName: string;
  stats: Stats;
  onCopyLink?: () => Promise<void> | void;
  isCopyLoading?: boolean;
};

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

export function QuizStatsTab({
  quizId: _quizId,
  quizName,
  stats,
  onCopyLink,
  isCopyLoading = false,
}: QuizStatsTabProps) {
  const { locale } = useLocale();
  const totalQuestions = stats.totalQuestions ?? 0;
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [attemptDetails, setAttemptDetails] = useState<{
    participantName: string;
    score: number | null;
    status: string;
    startedAt: Date;
    finishedAt: Date | null;
    answers: Array<{
      questionId: string;
      questionLabel: string;
      selectedOptions?: Array<{ id: string; label: string }>;
      correctOptions?: Array<{ id: string; label: string }>;
      correctOptionIds?: string[];
      isCorrect: boolean;
      timeSpent: number | null;
    }>;
    questionOrder?: Array<{ id: string; order: number }>;
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getDisplayStatus = (status: string, startedAt: Date | null): string => {
    if (status !== "IN_PROGRESS" || !startedAt) return status;
    const elapsed = Date.now() - new Date(startedAt).getTime();
    return elapsed >= FOUR_HOURS_MS ? "ABANDONED" : status;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="default" className="bg-green-700 dark:bg-green-800 text-white text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t(locale, "dashboard.completedLabel")}
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge variant="outline" className="text-xs dark:border-gray-400 dark:text-gray-400">
            <Clock className="h-3 w-3 mr-1" />
            {t(locale, "dashboard.inProgressLabel")}
          </Badge>
        );
      case "ABANDONED":
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-500 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            {t(locale, "dashboard.abandonedLabel")}
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const handleViewAttempt = async (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setIsLoadingDetails(true);
    try {
      const result = await getAttemptDetails(attemptId);
      if (result.success) setAttemptDetails(result.attempt);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h3 className="flex items-center gap-2 border-b border-border pb-3 text-base font-semibold">
          <ListChecks className="h-4 w-4 text-muted-foreground" />
          {t(locale, "dashboard.detailedResponsesTitle")}
        </h3>
        {stats.attempts.length === 0 ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {t(locale, "dashboard.noIdentifiedResultsYet")}
            </p>
            {onCopyLink && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onCopyLink}
                disabled={isCopyLoading}
              >
                <Copy className="h-4 w-4" />
                {isCopyLoading
                  ? t(locale, "common.loading")
                  : t(locale, "dashboard.copyLink")}
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="mt-4 hidden overflow-x-auto rounded-xl border border-border sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t(locale, "dashboard.participant")}</TableHead>
                    <TableHead>{t(locale, "dashboard.date")}</TableHead>
                    <TableHead>{t(locale, "dashboard.scoreLabel")}</TableHead>
                    <TableHead>{t(locale, "dashboard.statusLabel")}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.attempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium text-sm">
                        <span className="flex items-center gap-2">
                          {attempt.participantName}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(attempt.startedAt)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {attempt.score != null ? formatScoreFraction(attempt.score, totalQuestions) : "-"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(
                          getDisplayStatus(attempt.status, attempt.startedAt),
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-2"
                          onClick={() => handleViewAttempt(attempt.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {t(locale, "dashboard.viewAnswers")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 space-y-3 sm:hidden">
              {stats.attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="rounded-xl border border-border bg-card p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm">
                      {attempt.participantName}
                    </span>
                    {getStatusBadge(
                      getDisplayStatus(attempt.status, attempt.startedAt),
                    )}
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatDate(attempt.startedAt)}</span>
                    <span className="font-medium text-foreground">
                      {attempt.score != null ? formatScoreFraction(attempt.score, totalQuestions) : "-"}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handleViewAttempt(attempt.id)}
                  >
                    <Eye className="h-4 w-4" />
                    {t(locale, "dashboard.viewAnswers")}
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Attempt details dialog */}
      <Dialog
        open={selectedAttemptId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAttemptId(null);
            setAttemptDetails(null);
          }
        }}
      >
        <DialogContent className="max-w-[min(95vw,1100px)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {attemptDetails
                ? t(locale, "dashboard.answersOf", {
                    name: attemptDetails.participantName,
                  })
                : t(locale, "dashboard.answersDetailTitle")}
            </DialogTitle>
            <DialogDescription>
              {attemptDetails && `${quizName}`}
            </DialogDescription>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="text-center py-8">
              <p>{t(locale, "common.loading")}</p>
            </div>
          ) : attemptDetails ? (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-muted/30 p-4 md:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t(locale, "dashboard.scoreLabel")}
                  </p>
                  <p className="text-xl font-bold">
                    {attemptDetails.score != null && attemptDetails.answers
                      ? formatScoreFraction(
                          attemptDetails.score,
                          attemptDetails.answers.length
                        )
                      : attemptDetails.score != null
                        ? `${attemptDetails.score.toFixed(1)}%`
                        : "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t(locale, "dashboard.statusLabel")}
                  </p>
                  <div className="mt-1">
                    {getStatusBadge(
                      getDisplayStatus(attemptDetails.status, attemptDetails.startedAt),
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t(locale, "dashboard.startedAtLabel")}
                  </p>
                  <p className="text-sm"><FormattedDate date={attemptDetails.startedAt} locale={locale} /></p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t(locale, "dashboard.finishedAtLabel")}
                  </p>
                  <p className="text-sm"><FormattedDate date={attemptDetails.finishedAt} locale={locale} /></p>
                </div>
              </div>

              {(() => {
                const totalQuestions = attemptDetails.questionOrder?.length ?? attemptDetails.answers.length;
                const answeredCount = attemptDetails.answers.length;
                const correctCount = attemptDetails.answers.filter((a) => a.isCorrect).length;
                const incorrectCount = answeredCount - correctCount;
                if (totalQuestions <= 0) return null;
                const correctPct = (correctCount / totalQuestions) * 100;
                const incorrectPct = (incorrectCount / totalQuestions) * 100;
                const unansweredPct = 100 - correctPct - incorrectPct;
                return (
                  <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {t(locale, "dashboard.attemptQuestionProgress", {
                          current: String(answeredCount),
                          total: String(totalQuestions),
                        })}
                        {attemptDetails.status === "IN_PROGRESS" && (
                          <span className="ml-1.5 text-muted-foreground font-normal">
                            ({t(locale, "dashboard.inProgressLabel")})
                          </span>
                        )}
                      </span>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {t(locale, "dashboard.attemptProgressSummary", {
                          correct: String(correctCount),
                          incorrect: String(incorrectCount),
                        })}
                      </span>
                    </div>
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                      {correctPct > 0 && (
                        <div
                          className="h-full bg-green-600 transition-all duration-500 ease-out"
                          style={{ width: `${correctPct}%` }}
                        />
                      )}
                      {incorrectPct > 0 && (
                        <div
                          className="h-full bg-red-600 transition-all duration-500 ease-out"
                          style={{ width: `${incorrectPct}%` }}
                        />
                      )}
                      {unansweredPct > 0 && (
                        <div
                          className="h-full bg-muted-foreground/30 transition-all duration-500 ease-out"
                          style={{ width: `${unansweredPct}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="border-t border-border pt-6">
                <h3 className="mb-4 text-base font-semibold">
                  {t(locale, "dashboard.answersDetailTitle")}
                </h3>
                <div className="space-y-4">
                  {(() => {
                    type AnswerItem = (typeof attemptDetails.answers)[number];
                    const sortedAnswers = attemptDetails.questionOrder
                      ? attemptDetails.questionOrder
                          .map((q) =>
                            attemptDetails.answers.find((a) => a.questionId === q.id),
                          )
                          .filter((a): a is AnswerItem => a != null)
                      : attemptDetails.answers;
                    return sortedAnswers.map((answer, index) => (
                      <div
                        key={answer.questionId}
                        className={cn(
                          "rounded-xl border p-4 sm:p-5 space-y-4",
                          answer.isCorrect
                            ? "border-green-600/50 bg-green-50/60 dark:border-green-700/60 dark:bg-green-950/20"
                            : "border-red-600/50 bg-red-50/60 dark:border-red-700/60 dark:bg-red-950/20",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="text-xs uppercase tracking-wide text-muted-foreground">
                            {t(locale, "dashboard.questionLabel")} {index + 1}
                          </h4>
                          {answer.isCorrect ? (
                            <Badge
                              variant="default"
                              className="bg-green-700 dark:bg-green-800 text-xs"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {t(locale, "dashboard.correctLabel")}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-red-700 dark:bg-red-800 text-white border-0 text-xs"
                            >
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {t(locale, "dashboard.incorrectLabel")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-base font-semibold">{answer.questionLabel}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-1 uppercase text-xs">
                              {t(locale, "dashboard.yourAnswerLabel")}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {answer.selectedOptions?.length ? (
                                answer.selectedOptions.map((opt) => (
                                  <Badge
                                    key={opt.id}
                                    variant="outline"
                                    className={
                                      answer.correctOptionIds?.includes(opt.id)
                                        ? "border-green-500 text-green-600"
                                        : "border-red-500 text-red-600"
                                    }
                                  >
                                    {opt.label}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground">
                                  {t(locale, "quiz.noAnswer")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1 uppercase text-xs">
                              {t(locale, "dashboard.correctAnswerLabel")}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {answer.correctOptions?.length ? (
                                answer.correctOptions.map((opt) => (
                                  <Badge
                                    key={opt.id}
                                    variant="default"
                                    className="bg-green-700 dark:bg-green-800"
                                  >
                                    {opt.label}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground">
                                  {t(locale, "quiz.noAnswer")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="border-t border-border pt-2 text-xs text-muted-foreground">
                          {t(locale, "dashboard.timeSpentLabel")}:{" "}
                          {answer.timeSpent != null
                            ? formatDuration(answer.timeSpent)
                            : "-"}
                        </p>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
