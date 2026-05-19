"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Target,
  TrendingUp,
  FileText,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { richTextToPlainText } from "@/lib/rich-text/richTextToPlainText";
import { formatScoreFraction } from "@/lib/formatScore";
import { useToast } from "@/components/ui/toast";
import {
  deleteAllAttempts,
  getParticipantAttemptDetails,
} from "../../actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FormattedDate } from "@/components/ui/formatted-date";

type QuizAttemptsContentProps = {
  participant: {
    id: string;
    name: string;
    email: string | null;
  };
  link: {
    id: string;
    token: string;
    quizId: string;
    quizName: string;
    allowMultipleAttempts: boolean;
    totalQuestions: number;
    createdAt: Date;
    expiresAt: Date | null;
    revokedAt: Date | null;
    attempts: Array<{
      id: string;
      startedAt: Date;
      finishedAt: Date | null;
      score: number | null;
      status: string;
    }>;
  };
};

export function QuizAttemptsContent({
  participant,
  link,
}: QuizAttemptsContentProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const { showToast } = useToast();

  const [showDeleteAttemptsDialog, setShowDeleteAttemptsDialog] = useState(false);
  const [showAttemptDialog, setShowAttemptDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [attemptDetails, setAttemptDetails] = useState<{
    id: string;
    quizName: string;
    participantName: string;
    score: number | null;
    status: string;
    startedAt: Date;
    finishedAt: Date | null;
    answers: Array<{
      questionId: string;
      questionLabel: string;
      selectedOptionIds: string[];
      selectedOptions: Array<{ id: string; label: string }>;
      correctOptionIds: string[];
      correctOptions: Array<{ id: string; label: string }>;
      isCorrect: boolean;
      timeSpent: number | null;
    }>;
    questionOrder?: Array<{ id: string; order: number }>;
  } | null>(null);

  // Computed stats
  const totalAttempts = link.attempts.length;
  const completedAttempts = link.attempts.filter(
    (a) => a.status === "COMPLETED",
  ).length;
  const allScores = link.attempts
    .filter((a) => a.status === "COMPLETED" && a.score !== null)
    .map((a) => a.score as number);
  const averageScore =
    allScores.length > 0
      ? Math.round(allScores.reduce((s, v) => s + v, 0) / allScores.length)
      : null;
  const bestScore =
    allScores.length > 0 ? Math.max(...allScores) : null;

  const _formatDate = (date: Date | null) => {
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

  const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

  const getDisplayStatus = (
    status: string,
    startedAt: Date | null,
  ): string => {
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

  const handleViewAttempt = async (attemptId: string) => {
    setAttemptDetails(null);
    setIsLoadingDetails(true);
    setShowAttemptDialog(true);
    try {
      const result = await getParticipantAttemptDetails(attemptId);
      if (result.success) {
        setAttemptDetails(result.attempt);
      } else {
        showToast(result.error || t(locale, "common.error"), "error");
      }
    } catch {
      showToast(t(locale, "common.error"), "error");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleDeleteAllAttempts = async () => {
    setIsSubmitting(true);
    try {
      const result = await deleteAllAttempts(link.id);
      if (result.success) {
        showToast(t(locale, "dashboard.attemptsDeleted"), "success");
        setShowDeleteAttemptsDialog(false);
        router.refresh();
      } else {
        showToast(
          result.error || t(locale, "dashboard.deleteAttemptsError"),
          "error",
        );
      }
    } catch {
      showToast(t(locale, "dashboard.deleteAttemptsError"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="space-y-6 sm:space-y-8">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            router.push(`/dashboard/participants/${participant.id}`)
          }
          className="text-muted-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {locale === "fr"
            ? `Retour au profil de ${participant.name}`
            : `Back to ${participant.name}'s profile`}
        </Button>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {link.quizName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {participant.name}
            {participant.email && ` · ${participant.email}`}
          </p>
          {link.revokedAt && (
            <Badge
              variant="outline"
              className="border-orange-500 text-orange-500 mt-2"
            >
              {t(locale, "dashboard.revoked")}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {totalAttempts}
                </p>
                <p className="text-sm text-muted-foreground">
                  {totalAttempts <= 1
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
                <p className="text-2xl font-bold tabular-nums">
                  {completedAttempts}
                </p>
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
                  {averageScore !== null ? formatScoreFraction(averageScore, link.totalQuestions) : "-"}
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
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {bestScore !== null ? formatScoreFraction(bestScore, link.totalQuestions) : "-"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {locale === "fr" ? "Meilleur score" : "Best score"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attempts table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {t(locale, "dashboard.attemptsLabel")}
            </h2>
            {link.attempts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteAttemptsDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {locale === "fr" ? "Tout supprimer" : "Delete all"}
              </Button>
            )}
          </div>

          {link.attempts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
                  <Target className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  {locale === "fr"
                    ? "Aucune tentative pour le moment"
                    : "No attempts yet"}
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
                          <TableHead>{t(locale, "dashboard.date")}</TableHead>
                          <TableHead>
                            {t(locale, "dashboard.scoreLabel")}
                          </TableHead>
                          <TableHead>
                            {t(locale, "dashboard.statusLabel")}
                          </TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {link.attempts.map((attempt) => (
                          <TableRow key={attempt.id}>
                            <TableCell className="whitespace-nowrap text-sm">
                              <FormattedDate
                                date={attempt.startedAt}
                                locale={locale}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              <span suppressHydrationWarning>
                                {attempt.score !== null
                                  ? formatScoreFraction(attempt.score, link.totalQuestions)
                                  : "-"}
                              </span>
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
                {link.attempts.map((attempt) => (
                  <Card key={attempt.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          <FormattedDate
                            date={attempt.startedAt}
                            locale={locale}
                          />
                        </p>
                        {getStatusBadge(
                          getDisplayStatus(attempt.status, attempt.startedAt),
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-semibold">
                          <span suppressHydrationWarning>
                            {attempt.score !== null
                              ? formatScoreFraction(attempt.score, link.totalQuestions)
                              : "-"}
                          </span>
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue"
                          onClick={() => handleViewAttempt(attempt.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {t(locale, "dashboard.viewAttempt")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete All Attempts Dialog */}
      <AlertDialog
        open={showDeleteAttemptsDialog}
        onOpenChange={setShowDeleteAttemptsDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(locale, "dashboard.deleteAllAttempts")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(locale, "dashboard.deleteAllAttemptsConfirm", {
                quizName: link.quizName,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {t(locale, "common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllAttempts}
              disabled={isSubmitting}
              className={buttonVariants({ variant: "destructive" })}
            >
              {isSubmitting
                ? t(locale, "common.loading")
                : t(locale, "dashboard.deleteAllAttempts")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Attempt Details Dialog */}
      <Dialog open={showAttemptDialog} onOpenChange={setShowAttemptDialog}>
        <DialogContent className="max-w-[min(95vw,1400px)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t(locale, "dashboard.attemptDetailsDialog")}
            </DialogTitle>
            <DialogDescription>
              {attemptDetails && (
                <>
                  {attemptDetails.quizName} — {attemptDetails.participantName}
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
                    <span suppressHydrationWarning>
                      {attemptDetails.score !== null && attemptDetails.answers
                        ? formatScoreFraction(
                            attemptDetails.score,
                            attemptDetails.answers.length
                          )
                        : attemptDetails.score != null
                          ? `${attemptDetails.score.toFixed(1)}%`
                          : "-"}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t(locale, "dashboard.statusLabel")}
                  </p>
                  <div className="mt-1">
                    {getStatusBadge(
                      getDisplayStatus(
                        attemptDetails.status,
                        attemptDetails.startedAt,
                      ),
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t(locale, "dashboard.startedAtLabel")}
                  </p>
                  <p className="text-sm">
                    <FormattedDate date={attemptDetails.startedAt} locale={locale} />
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t(locale, "dashboard.finishedAtLabel")}
                  </p>
                  <p className="text-sm">
                    <FormattedDate date={attemptDetails.finishedAt} locale={locale} />
                  </p>
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
                            attemptDetails.answers.find(
                              (a) => a.questionId === q.id,
                            ),
                          )
                          .filter((a): a is AnswerItem => a != null)
                      : attemptDetails.answers;

                    return sortedAnswers.map((answer, index: number) => (
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
                              className="bg-red-700 dark:bg-red-800 text-white dark:text-white"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              {t(locale, "dashboard.incorrectLabel")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-lg h1 font-semibold">
                          {richTextToPlainText(answer.questionLabel)}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-normal h1 text-muted-foreground mb-2 uppercase">
                              {t(locale, "dashboard.yourAnswerLabel")}
                            </p>
                            <div className="space-y-1">
                              {answer.selectedOptions?.length > 0 ? (
                                answer.selectedOptions.map((opt) => (
                                  <Badge
                                    key={opt.id}
                                    variant="outline"
                                    className={
                                      answer.correctOptionIds.includes(opt.id)
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
                            <p className="text-sm font-normal h1 text-muted-foreground mb-2 uppercase">
                              {t(locale, "dashboard.correctAnswerLabel")}
                            </p>
                            <div className="space-y-1">
                              {answer.correctOptions?.length > 0 ? (
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
                            {answer.timeSpent !== null
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
  );
}
