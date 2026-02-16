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
  ChevronDown,
  ChevronUp,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  UserX,
  ListChecks,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { FormattedDate } from "@/components/ui/formatted-date";
import { getAttemptDetails } from "./actions";

type Stats = {
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

type QuizStatsTabProps = {
  quizId: string;
  quizName: string;
  stats: Stats;
};

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

export function QuizStatsTab({
  quizId,
  quizName,
  stats,
}: QuizStatsTabProps) {
  const { locale } = useLocale();
  const [showParticipants, setShowParticipants] = useState(false);
  const [showAnonymous, setShowAnonymous] = useState(false);
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

  const anonymousAttempts = stats.attempts.filter((a) => a.isAnonymous);

  return (
    <div className="space-y-8">
      {/* Participants inscrits */}
      <section>
        <button
          type="button"
          onClick={() => setShowParticipants(!showParticipants)}
          className="flex items-center justify-between w-full text-left py-2 border-b border-border"
        >
          <span className="flex items-center gap-2 font-medium">
            <Users className="h-4 w-4 text-muted-foreground" />
            {t(locale, "dashboard.enrolledParticipants")}
          </span>
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="tabular-nums">{stats.enrolledParticipantsCount}</span>
            {showParticipants ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        </button>
        {showParticipants && (
          <ul className="mt-3 space-y-2 text-sm">
            {stats.participants.length === 0 ? (
              <li className="text-muted-foreground py-2">
                {t(locale, "dashboard.noParticipants")}
              </li>
            ) : (
              stats.participants.map((p) => (
                <li key={p.id} className="flex justify-between items-center py-1.5">
                  <span>{p.name}</span>
                  {p.email && (
                    <span className="text-muted-foreground text-xs truncate max-w-[180px]">
                      {p.email}
                    </span>
                  )}
                  <span className="text-muted-foreground tabular-nums">
                    {p.attemptsCount} {t(locale, "dashboard.attempts")}
                  </span>
                </li>
              ))
            )}
          </ul>
        )}
      </section>

      {/* Tentatives anonymes */}
      <section>
        <button
          type="button"
          onClick={() => setShowAnonymous(!showAnonymous)}
          className="flex items-center justify-between w-full text-left py-2 border-b border-border"
        >
          <span className="flex items-center gap-2 font-medium">
            <UserX className="h-4 w-4 text-muted-foreground" />
            {t(locale, "dashboard.anonymousAttempts")}
          </span>
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="tabular-nums">{stats.anonymousAttemptsCount}</span>
            {showAnonymous ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        </button>
        {showAnonymous && (
          <ul className="mt-3 space-y-2 text-sm">
            {anonymousAttempts.length === 0 ? (
              <li className="text-muted-foreground py-2">
                {locale === "fr" ? "Aucune tentative anonyme" : "No anonymous attempts"}
              </li>
            ) : (
              anonymousAttempts.map((a) => (
                <li
                  key={a.id}
                  className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0"
                >
                  <span className="text-muted-foreground">
                    {formatDate(a.startedAt)}
                  </span>
                  <span className="tabular-nums">
                    {a.score != null ? `${a.score.toFixed(0)}%` : "-"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleViewAttempt(a.id)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    {t(locale, "dashboard.viewAttempt")}
                  </Button>
                </li>
              ))
            )}
          </ul>
        )}
      </section>

      {/* Toutes les tentatives */}
      <section>
        <h3 className="font-medium flex items-center gap-2 py-2 border-b border-border">
          <ListChecks className="h-4 w-4 text-muted-foreground" />
          {t(locale, "dashboard.attemptsLabel")}
        </h3>
        {stats.attempts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6">
            {t(locale, "dashboard.noAttemptsYet")}
          </p>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto mt-3">
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
                          {attempt.isAnonymous && (
                            <Badge variant="secondary" className="text-xs">
                              {t(locale, "dashboard.anonymous")}
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(attempt.startedAt)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {attempt.score != null ? `${attempt.score.toFixed(1)}%` : "-"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(
                          getDisplayStatus(attempt.status, attempt.startedAt),
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => handleViewAttempt(attempt.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {t(locale, "dashboard.viewAttempt")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="sm:hidden space-y-2 mt-3">
              {stats.attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex flex-col gap-2 py-3 border-b border-border last:border-0"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm">
                      {attempt.participantName}
                      {attempt.isAnonymous && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {t(locale, "dashboard.anonymous")}
                        </Badge>
                      )}
                    </span>
                    {getStatusBadge(
                      getDisplayStatus(attempt.status, attempt.startedAt),
                    )}
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatDate(attempt.startedAt)}</span>
                    <span className="font-medium text-foreground">
                      {attempt.score != null ? `${attempt.score.toFixed(1)}%` : "-"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-primary"
                    onClick={() => handleViewAttempt(attempt.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t(locale, "dashboard.viewAttempt")}
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
        <DialogContent className="max-w-[min(95vw,1400px)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t(locale, "dashboard.attemptDetailsDialog")}</DialogTitle>
            <DialogDescription>
              {attemptDetails && `${quizName} — ${attemptDetails.participantName}`}
            </DialogDescription>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="text-center py-8">
              <p>{t(locale, "common.loading")}</p>
            </div>
          ) : attemptDetails ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t(locale, "dashboard.scoreLabel")}
                  </p>
                  <p className="text-lg font-semibold">
                    {attemptDetails.score != null
                      ? `${attemptDetails.score.toFixed(1)}%`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t(locale, "dashboard.statusLabel")}
                  </p>
                  <div className="mt-1">
                    {getStatusBadge(
                      getDisplayStatus(attemptDetails.status, attemptDetails.startedAt),
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t(locale, "dashboard.startedAtLabel")}
                  </p>
                  <p className="text-sm"><FormattedDate date={attemptDetails.startedAt} locale={locale} /></p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t(locale, "dashboard.finishedAtLabel")}
                  </p>
                  <p className="text-sm"><FormattedDate date={attemptDetails.finishedAt} locale={locale} /></p>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <h3 className="font-medium mb-4">
                  {t(locale, "dashboard.attemptDetails")}
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
                          "border rounded-lg p-4 space-y-3",
                          answer.isCorrect
                            ? "border-green-700 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
                            : "border-red-700 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm text-muted-foreground uppercase">
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
                        <p className="font-semibold">{answer.questionLabel}</p>
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
                        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
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
