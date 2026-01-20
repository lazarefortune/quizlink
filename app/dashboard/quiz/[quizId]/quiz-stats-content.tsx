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
import { ArrowLeft, Users, FileQuestion, CheckCircle2, Clock } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { getAttemptDetails } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Stats = {
  totalInvitations: number;
  totalParticipants: number;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  completionRate: number;
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
    score: number | null;
    duration: number | null;
    status: string;
    startedAt: Date;
    finishedAt: Date | null;
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
  const [attemptDetails, setAttemptDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const handleViewAttempt = async (attemptId: string) => {
    setSelectedAttemptId(attemptId);
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
    return new Date(date).toLocaleString(locale);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t(locale, "dashboard.backToDashboard")}
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">{quizName}</h1>
            <p className="text-muted-foreground mt-2">
              {t(locale, "dashboard.statsSubtitle")}
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                {t(locale, "dashboard.totalParticipants")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalParticipants}</div>
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
                      <TableCell className="font-medium">
                        {participant.name}
                        {participant.email && (
                          <span className="text-xs text-muted-foreground block">
                            {participant.email}
                          </span>
                        )}
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
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "dashboard.attempts")}</CardTitle>
            <CardDescription>
              {t(locale, "dashboard.attemptsDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t(locale, "dashboard.participant")}</TableHead>
                  <TableHead>{t(locale, "dashboard.score")}</TableHead>
                  <TableHead>{t(locale, "dashboard.duration")}</TableHead>
                  <TableHead>{t(locale, "dashboard.status")}</TableHead>
                  <TableHead>{t(locale, "dashboard.date")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.attempts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {t(locale, "dashboard.noAttempts")}
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.attempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium">
                        {attempt.participantName}
                      </TableCell>
                      <TableCell>
                        {attempt.score !== null
                          ? `${attempt.score.toFixed(1)}%`
                          : "-"}
                      </TableCell>
                      <TableCell>{formatDuration(attempt.duration)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            attempt.status === "COMPLETED"
                              ? "default"
                              : "outline"
                          }
                        >
                          {attempt.status === "COMPLETED"
                            ? t(locale, "dashboard.completed")
                            : attempt.status === "IN_PROGRESS"
                              ? t(locale, "dashboard.inProgress")
                              : t(locale, "dashboard.abandoned")}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(attempt.startedAt)}</TableCell>
                      <TableCell>
                        {attempt.status === "COMPLETED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewAttempt(attempt.id)}
                          >
                            {t(locale, "dashboard.view")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Attempt Details Dialog */}
        <Dialog
          open={selectedAttemptId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedAttemptId(null);
              setAttemptDetails(null);
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {t(locale, "dashboard.attemptDetails")}
              </DialogTitle>
              <DialogDescription>
                {attemptDetails?.participantName}
              </DialogDescription>
            </DialogHeader>
            {isLoadingDetails ? (
              <p className="text-muted-foreground">
                {t(locale, "common.loading")}
              </p>
            ) : attemptDetails ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">
                      {t(locale, "dashboard.score")}
                    </p>
                    <p className="text-2xl font-bold">
                      {attemptDetails.score !== null
                        ? `${attemptDetails.score.toFixed(1)}%`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {t(locale, "dashboard.date")}
                    </p>
                    <p className="text-sm">
                      {formatDate(attemptDetails.finishedAt || attemptDetails.startedAt)}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">
                    {t(locale, "quiz.detailedResults")}
                  </h4>
                  {attemptDetails.answers.map((answer: any, index: number) => (
                    <Card
                      key={answer.questionId}
                      className={
                        answer.isCorrect ? "border-green-500" : "border-red-500"
                      }
                    >
                      <CardHeader>
                        <CardTitle className="text-base">
                          {t(locale, "quiz.question")} {index + 1}:{" "}
                          {answer.questionLabel}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <p className="text-sm font-medium mb-1">
                            {t(locale, "dashboard.yourAnswerLabel")}:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {answer.selectedOptions && answer.selectedOptions.length > 0 ? (
                              answer.selectedOptions.map((opt: { id: string; label: string }) => (
                                <Badge
                                  key={opt.id}
                                  variant="outline"
                                  className={
                                    answer.correctOptionIds.includes(opt.id)
                                      ? "border-green-500 text-green-500"
                                      : "border-red-500 text-red-500"
                                  }
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
                        {!answer.isCorrect && (
                          <div>
                            <p className="text-sm font-medium mb-1">
                              {t(locale, "dashboard.correctAnswerLabel")}:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {answer.correctOptions && answer.correctOptions.length > 0 ? (
                                answer.correctOptions.map((opt: { id: string; label: string }) => (
                                  <Badge key={opt.id} variant="default" className="bg-green-500">
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
                        )}
                        {answer.timeSpent && (
                          <p className="text-xs text-muted-foreground">
                            {t(locale, "dashboard.timeSpentLabel")}: {formatDuration(answer.timeSpent)}{" "}
                            {t(locale, "dashboard.secondsLabel")}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
