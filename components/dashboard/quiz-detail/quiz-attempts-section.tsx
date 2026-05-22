"use client";

import { useState } from "react";
import { Eye } from "lucide-react";

import type { QuizDetailAttemptRow } from "@/lib/dashboard/creator-response-attempts";
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
import { formatDurationShort } from "@/lib/dashboard/quiz-detail-stats";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";

import { QuizAttemptDetailDialog } from "./quiz-attempt-detail-dialog";

type QuizAttemptsSectionProps = {
  attempts: QuizDetailAttemptRow[];
};

function formatAttemptDate(date: Date, locale: string): string {
  return date.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(
  status: string,
  locale: Parameters<typeof t>[0],
): string {
  if (status === "COMPLETED") {
    return t(locale, "dashboard.attemptStatus.completed");
  }
  if (status === "ABANDONED") {
    return t(locale, "dashboard.attemptStatus.abandoned");
  }
  return t(locale, "dashboard.attemptStatus.started");
}

function formatScoreCell(
  attempt: QuizDetailAttemptRow,
  locale: Parameters<typeof t>[0],
): string {
  if (attempt.status === "ABANDONED" || attempt.status === "IN_PROGRESS") {
    return t(locale, "dashboard.attemptNotFinished");
  }
  if (attempt.score != null) {
    return `${attempt.score.toFixed(1)}%`;
  }
  return "—";
}

function formatQuestionsCell(
  attempt: QuizDetailAttemptRow,
  locale: Parameters<typeof t>[0],
): string {
  if (attempt.totalQuestions != null && attempt.totalQuestions > 0) {
    return t(locale, "dashboard.questionsAnsweredProgress", {
      answered: attempt.questionsAnswered,
      total: attempt.totalQuestions,
    });
  }
  return String(attempt.questionsAnswered);
}

export function QuizAttemptsSection({ attempts }: QuizAttemptsSectionProps) {
  const { locale } = useLocale();
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetail = (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setDetailOpen(true);
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{t(locale, "dashboard.latestAttempts")}</h2>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t(locale, "dashboard.participant")}</TableHead>
              <TableHead className="text-right">{t(locale, "dashboard.score")}</TableHead>
              <TableHead>{t(locale, "dashboard.questionsAnswered")}</TableHead>
              <TableHead>{t(locale, "dashboard.date")}</TableHead>
              <TableHead>{t(locale, "dashboard.duration")}</TableHead>
              <TableHead>{t(locale, "dashboard.status")}</TableHead>
              <TableHead className="w-[140px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {attempts.map((attempt) => (
              <TableRow key={attempt.id}>
                <TableCell className="font-medium">
                  {attempt.isAnonymous && attempt.anonymousNumber != null
                    ? t(locale, "dashboard.anonymousParticipant", {
                        number: attempt.anonymousNumber,
                      })
                    : attempt.participantLabel}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatScoreCell(attempt, locale)}
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {formatQuestionsCell(attempt, locale)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatAttemptDate(attempt.finishedAt ?? attempt.startedAt, locale)}
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {attempt.durationSeconds != null
                    ? formatDurationShort(attempt.durationSeconds)
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      attempt.status === "COMPLETED"
                        ? "default"
                        : attempt.status === "ABANDONED"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {statusLabel(attempt.status, locale)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => openDetail(attempt.id)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {t(locale, "dashboard.viewAttemptDetails")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <QuizAttemptDetailDialog
        attemptId={selectedAttemptId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </section>
  );
}
