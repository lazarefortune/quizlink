"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  ArrowLeft,
  Users,
  FileQuestion,
  CheckCircle2,
  Clock,
  Globe,
  Lock,
  Settings2,
  Calendar,
  Eye,
  AlertCircle,
  Target,
  TrendingUp,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { ParticipantAvatar } from "@/components/participant-avatar";
import { getAttemptDetails } from "./actions";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type QuizSettings = {
  showAnswerImmediately?: boolean;
  randomizeQuestions?: boolean;
  timeLimitPerQuestion?: number | null;
};

type Stats = {
  totalInvitations: number;
  enrolledParticipantsCount: number;
  totalParticipants: number;
  totalAttempts: number;
  anonymousAttemptsCount: number;
  completedAttempts: number;
  averageScore: number;
  completionRate: number;
  totalQuestions: number;
  quizDetails: {
    visibility: string;
    settings: QuizSettings;
    createdAt: Date;
  };
  participants: Array<{
    id: string;
    name: string;
    email: string | null;
    avatar: string | null;
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
    questionsAnswered: number;
  }>;
};

type QuizStatsContentProps = {
  quizName: string;
  stats: Stats;
  quizId: string;
};

export function QuizStatsContent({
  quizName,
  stats,
  quizId,
}: QuizStatsContentProps) {
  const router = useRouter();
  const { locale } = useLocale();
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

  const handleViewAttempt = async (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setAttemptDetails(null);
    setIsLoadingDetails(true);
    try {
      const result = await getAttemptDetails(attemptId);
      if (result.success) {
        setAttemptDetails(result.attempt);
      }
    } catch (error) {
      console.error("Error loading attempt details:", error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

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

  const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
  const getDisplayStatus = (status: string, startedAt: Date | null): string => {
    if (status !== "IN_PROGRESS" || !startedAt) return status;
    const elapsed = Date.now() - new Date(startedAt).getTime();
    return elapsed >= FOUR_HOURS_MS ? "ABANDONED" : status;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="default" className="bg-green-700 dark:bg-green-800 text-white dark:text-white">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t(locale, "dashboard.completedLabel")}
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge variant="outline" className="dark:border-gray-400 dark:text-gray-400">
            <Clock className="h-3 w-3 mr-1" />
            {t(locale, "dashboard.inProgressLabel")}
          </Badge>
        );
      case "ABANDONED":
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-500">
            <AlertCircle className="h-3 w-3 mr-1" />
            {t(locale, "dashboard.abandonedLabel")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const attemptsStats = {
    total: stats.totalAttempts,
    completed: stats.completedAttempts,
    averageScore: stats.averageScore,
    bestScore:
      stats.attempts.filter((a) => a.status === "COMPLETED" && a.score != null).length > 0
        ? Math.max(
            ...stats.attempts
              .filter((a) => a.status === "COMPLETED" && a.score != null)
              .map((a) => a.score as number),
          )
        : null,
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Link href="/dashboard/quizzes">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t(locale, "dashboard.backToDashboard")}
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/builder/${quizId}`)}
              >
                {t(locale, "dashboard.edit")}
              </Button>
            </div>
            <h1 className="text-3xl font-bold">{quizName}</h1>
            <p className="text-muted-foreground mt-2">
              {t(locale, "dashboard.statsSubtitle")}
            </p>
          </div>
        </div>

        {/* Quiz details card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              {t(locale, "dashboard.quizDetails")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t(locale, "dashboard.visibility")}
              </p>
              <div className="mt-1 flex items-center gap-2">
                {stats.quizDetails.visibility === "PUBLIC" ? (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <span>
                  {stats.quizDetails.visibility === "PUBLIC"
                    ? t(locale, "dashboard.public")
                    : t(locale, "dashboard.private")}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t(locale, "dashboard.questions")}
              </p>
              <p className="mt-1">{stats.totalQuestions}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t(locale, "builder.showAnswerImmediately")}
              </p>
              <p className="mt-1">
                {stats.quizDetails.settings.showAnswerImmediately
                  ? t(locale, "common.yes")
                  : t(locale, "common.no")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t(locale, "builder.randomizeQuestions")}
              </p>
              <p className="mt-1">
                {stats.quizDetails.settings.randomizeQuestions
                  ? t(locale, "common.yes")
                  : t(locale, "common.no")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t(locale, "builder.timeLimitPerQuestion")}
              </p>
              <p className="mt-1">
                {stats.quizDetails.settings.timeLimitPerQuestion != null
                  ? `${stats.quizDetails.settings.timeLimitPerQuestion} s`
                  : t(locale, "dashboard.noTimeLimit")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {t(locale, "dashboard.createdOn")}
              </p>
              <p className="mt-1">{formatDate(stats.quizDetails.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t(locale, "dashboard.totalInvitations")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvitations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t(locale, "dashboard.enrolledParticipants")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.enrolledParticipantsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalParticipants} {t(locale, "dashboard.attemptedCountSubtitle")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t(locale, "dashboard.totalAttempts")}
              </CardTitle>
              <FileQuestion className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAttempts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completedAttempts} {t(locale, "dashboard.completed")}
              </p>
            </CardContent>
          </Card>

          {stats.anonymousAttemptsCount > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t(locale, "dashboard.anonymousAttempts")}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.anonymousAttemptsCount}</div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t(locale, "dashboard.averageScore")}
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageScore.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completionRate.toFixed(1)}% {t(locale, "dashboard.completionRate")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Participants Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "dashboard.participants")}</CardTitle>
            <CardDescription>
              {t(locale, "dashboard.participantsDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t(locale, "dashboard.name")}</TableHead>
                  <TableHead>{t(locale, "dashboard.attempts")}</TableHead>
                  <TableHead>{t(locale, "dashboard.lastScore")}</TableHead>
                  <TableHead>{t(locale, "dashboard.lastAttempt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.participants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {t(locale, "dashboard.noParticipants")}
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.participants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ParticipantAvatar
                            avatar={participant.avatar}
                            name={participant.name}
                            size="sm"
                          />
                          <div>
                            <div className="font-medium">{participant.name}</div>
                            {participant.email && (
                              <span className="text-xs text-muted-foreground">
                                {participant.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{participant.attemptsCount}</TableCell>
                      <TableCell>
                        {participant.lastScore !== null
                          ? `${participant.lastScore.toFixed(1)}%`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {formatDate(participant.lastAttemptDate)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Attempts Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              {t(locale, "dashboard.attemptsLabel")}
            </h2>
            <CardDescription className="mt-0.5">
              {t(locale, "dashboard.attemptsDescription")}
            </CardDescription>
          </div>

          {/* Attempts stats row (like participant page) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{attemptsStats.total}</p>
                  <p className="text-sm text-muted-foreground">
                    {attemptsStats.total <= 1
                      ? (locale === "fr" ? "Tentative" : "Attempt")
                      : (locale === "fr" ? "Tentatives" : "Attempts")}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-highlight/10 text-highlight">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{attemptsStats.completed}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(locale, "dashboard.completed")}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {attemptsStats.averageScore != null ? `${attemptsStats.averageScore.toFixed(0)}%` : "-"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {locale === "fr" ? "Score moyen" : "Avg. score"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue/10 text-blue">
                  <FileQuestion className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {attemptsStats.bestScore != null ? `${attemptsStats.bestScore.toFixed(0)}%` : "-"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {locale === "fr" ? "Meilleur score" : "Best score"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {stats.attempts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
                  <Target className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  {t(locale, "dashboard.noAttemptsYet")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block">
                <Card>
                  <div className="overflow-x-auto">
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
                            <TableCell className="font-medium">
                              <span className="flex items-center gap-2">
                                {attempt.participantName}
                                {attempt.isAnonymous && (
                                  <Badge variant="secondary" className="text-xs">
                                    {t(locale, "dashboard.anonymous")}
                                  </Badge>
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              {formatDate(attempt.startedAt)}
                            </TableCell>
                            <TableCell>
                              {attempt.score !== null
                                ? `${attempt.score.toFixed(1)}%`
                                : "-"}
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
                </Card>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 sm:hidden">
                {stats.attempts.map((attempt) => (
                  <Card key={attempt.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 font-medium">
                          {attempt.participantName}
                          {attempt.isAnonymous && (
                            <Badge variant="secondary" className="text-xs">
                              {t(locale, "dashboard.anonymous")}
                            </Badge>
                          )}
                        </span>
                        {getStatusBadge(
                          getDisplayStatus(attempt.status, attempt.startedAt),
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{formatDate(attempt.startedAt)}</span>
                        <span className="font-medium text-foreground">
                          {attempt.score !== null
                            ? `${attempt.score.toFixed(1)}%`
                            : "-"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-blue"
                        onClick={() => handleViewAttempt(attempt.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t(locale, "dashboard.viewAttempt")}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Attempt Details Dialog (same layout as participant attempt details) */}
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
              <DialogTitle>
                {t(locale, "dashboard.attemptDetailsDialog")}
              </DialogTitle>
              <DialogDescription>
                {attemptDetails && (
                  <>
                    {quizName} — {attemptDetails.participantName}
                  </>
                )}
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
                      {attemptDetails.score !== null
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
                    <p className="text-sm">
                      {formatDate(attemptDetails.startedAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t(locale, "dashboard.finishedAtLabel")}
                    </p>
                    <p className="text-sm">
                      {formatDate(attemptDetails.finishedAt)}
                    </p>
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
                            "border border-border rounded-lg p-4 space-y-3",
                            answer.isCorrect
                              ? "border-green-700 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
                              : "border-red-700 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20",
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <h4 className="font-normal text-sm text-muted-foreground uppercase">
                              {t(locale, "dashboard.questionLabel")} {index + 1}
                            </h4>
                            {answer.isCorrect ? (
                              <Badge
                                variant="default"
                                className="bg-green-700 dark:bg-green-800"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1 text-white dark:text-white" />
                                {t(locale, "dashboard.correctLabel")}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-red-700 dark:bg-red-800 text-white dark:text-white border-0"
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {t(locale, "dashboard.incorrectLabel")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-lg font-semibold">
                            {answer.questionLabel}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-normal text-muted-foreground mb-2 uppercase">
                                {t(locale, "dashboard.yourAnswerLabel")}
                              </p>
                              <div className="space-y-1">
                                {answer.selectedOptions?.length ? (
                                  answer.selectedOptions.map((opt) => (
                                    <Badge
                                      key={opt.id}
                                      variant="outline"
                                      className={
                                        answer.correctOptionIds?.includes(opt.id)
                                          ? "border-green-500 text-green-500 dark:border-green-400 dark:text-green-400"
                                          : "border-red-500 text-red-500 dark:border-red-400 dark:text-red-400"
                                      }
                                    >
                                      {opt.label}
                                    </Badge>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    {t(locale, "quiz.noAnswer")}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-normal text-muted-foreground mb-2 uppercase">
                                {t(locale, "dashboard.correctAnswerLabel")}
                              </p>
                              <div className="space-y-1">
                                {answer.correctOptions?.length ? (
                                  answer.correctOptions.map((opt) => (
                                    <Badge
                                      key={opt.id}
                                      variant="default"
                                      className="bg-green-700 dark:bg-green-800 text-white dark:text-white"
                                    >
                                      {opt.label}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    {t(locale, "quiz.noAnswer")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm uppercase font-normal text-muted-foreground pt-2 border-t border-border">
                            <span>{t(locale, "dashboard.timeSpentLabel")}: </span>
                            <span className="font-medium">
                              {answer.timeSpent != null
                                ? formatDuration(answer.timeSpent)
                                : "-"}
                            </span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t(locale, "common.error")}</p>
                <p className="text-sm mt-2">
                  {t(locale, "dashboard.attemptDetailsLoadFailed")}
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
