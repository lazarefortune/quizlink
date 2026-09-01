"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Eye } from "lucide-react";

import type { QuizDetailAttemptRow } from "@/lib/dashboard/creator-response-attempts";
import { buildLockedPlaceholderRowKeys } from "@/lib/dashboard/creator-response-attempts";
import { resolveAttemptDetailsError } from "@/lib/dashboard/resolve-attempt-details-error";
import { PlayfulSectionTitle } from "@/components/ui/playful-section-title";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuizAttemptParticipantGameIcon } from "@/components/dashboard/quiz-detail/quiz-attempt-participant-game-icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDurationShort } from "@/lib/dashboard/quiz-detail-stats";
import { formatDateTime } from "@/lib/date-time/format";
import { useTimeZone } from "@/lib/date-time/timezone-provider";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import { QuizAttemptDetailDialog } from "./quiz-attempt-detail-dialog";

const ATTEMPTS_TABLE_SPRING = {
  type: "spring" as const,
  stiffness: 420,
  damping: 22,
  mass: 0.85,
};

const MotionTableRow = motion.create(TableRow);

type QuizAttemptsSectionProps = {
  attempts: QuizDetailAttemptRow[];
  totalAttemptCount: number;
  lockedAttemptCount: number;
  detailedPreviewLimit: number;
  isUnlocked: boolean;
  onUnlockClick: () => void;
};

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

/** Placeholder rows — raw <tr> for the blurred preview table (not the Table UI wrapper). */
function LockedAttemptPreviewRow({
  rowKey,
  locale,
}: {
  rowKey: string;
  locale: Parameters<typeof t>[0];
}) {
  return (
    <tr key={rowKey} className="border-b border-border">
      <td className="px-4 py-3 font-medium">
        <span className="text-muted-foreground select-none">
          {t(locale, "dashboard.lockedResponse")}
        </span>
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground select-none">
        {t(locale, "dashboard.lockedScore")}
      </td>
      <td className="px-4 py-3 text-muted-foreground select-none">—</td>
      <td className="px-4 py-3 text-muted-foreground select-none">—</td>
      <td className="px-4 py-3 text-muted-foreground select-none">—</td>
      <td className="px-4 py-3">
        <Badge variant="secondary" className="text-muted-foreground select-none">
          {t(locale, "dashboard.lockedStatus")}
        </Badge>
      </td>
      <td className="w-[140px] px-4 py-3" />
    </tr>
  );
}

type LockedAttemptsBlurPreviewProps = {
  rowKeys: string[];
  locale: Parameters<typeof t>[0];
};

/**
 * Fake attempt rows with a light blur. Uses a native table (not `Table`) so CSS filter applies reliably.
 */
function LockedAttemptsBlurPreview({ rowKeys, locale }: LockedAttemptsBlurPreviewProps) {
  return (
    <div
      data-testid="locked-attempts-blur-layer"
      className="overflow-hidden"
      aria-hidden
    >
      <div className="pointer-events-none select-none opacity-90 [filter:blur(3px)]">
        <table className="w-full min-w-[720px] caption-bottom text-sm">
          <tbody>
            {rowKeys.map((rowKey) => (
              <LockedAttemptPreviewRow key={rowKey} rowKey={rowKey} locale={locale} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function QuizAttemptsSection({
  attempts,
  lockedAttemptCount,
  isUnlocked,
  onUnlockClick,
}: QuizAttemptsSectionProps) {
  const { locale } = useLocale();
  const { timeZone } = useTimeZone();
  const prefersReducedMotion = useReducedMotion();
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const showLockedZone = !isUnlocked && lockedAttemptCount > 0;

  const lockedPlaceholderKeys = buildLockedPlaceholderRowKeys(lockedAttemptCount);

  const tableEntranceDelay = prefersReducedMotion ? 0 : 0.1;
  const headerRowDelay = prefersReducedMotion ? 0 : 0.16;

  const openDetail = (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setDetailOpen(true);
  };

  return (
    <section className="space-y-4">
      <PlayfulSectionTitle
        as="h3"
        className="text-2xl font-semibold text-zinc-700 dark:text-zinc-300"
      >
        {t(locale, "dashboard.latestAttempts")}
      </PlayfulSectionTitle>

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          ...ATTEMPTS_TABLE_SPRING,
          delay: tableEntranceDelay,
        }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <MotionTableRow
                initial={prefersReducedMotion ? false : { opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  ...ATTEMPTS_TABLE_SPRING,
                  delay: headerRowDelay,
                }}
              >
                <TableHead>
                  {t(locale, "dashboard.attemptPlayerColumn")}
                </TableHead>
                <TableHead className="text-right">
                  {t(locale, "dashboard.score")}
                </TableHead>
                <TableHead>
                  {t(locale, "dashboard.questionsAnswered")}
                </TableHead>
                <TableHead>{t(locale, "dashboard.date")}</TableHead>
                <TableHead>{t(locale, "dashboard.duration")}</TableHead>
                <TableHead>{t(locale, "dashboard.status")}</TableHead>
                <TableHead className="w-[140px]" />
              </MotionTableRow>
            </TableHeader>
            <TableBody>
              {attempts.map((attempt, index) => (
                <MotionTableRow
                  key={attempt.id}
                  initial={
                    prefersReducedMotion ? false : { opacity: 0, x: -16 }
                  }
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    ...ATTEMPTS_TABLE_SPRING,
                    delay: prefersReducedMotion
                      ? 0
                      : headerRowDelay + 0.06 + index * 0.06,
                  }}
                >
                  <TableCell className="font-medium text-base">
                    <div className="flex items-center gap-2">
                      <QuizAttemptParticipantGameIcon className="mt-0.5" />
                      <div className="min-w-0 flex flex-col gap-0.5">
                        <span>
                          {attempt.isAnonymous &&
                          attempt.anonymousNumber != null
                            ? t(locale, "dashboard.anonymousParticipant", {
                                number: attempt.anonymousNumber,
                              })
                            : attempt.participantLabel}
                        </span>
                        {attempt.participantEmailHint ? (
                          <span className="text-xs font-normal text-muted-foreground">
                            {attempt.participantEmailHint}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground text-base">
                    {formatScoreCell(attempt, locale)}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground text-base">
                    {formatQuestionsCell(attempt, locale)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-base">
                    {formatDateTime(
                      attempt.finishedAt ?? attempt.startedAt,
                      locale,
                      timeZone,
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground text-base">
                    {attempt.durationSeconds != null
                      ? formatDurationShort(attempt.durationSeconds)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-base">
                    <Badge
                      variant={
                        attempt.status === "COMPLETED"
                          ? "default"
                          : attempt.status === "ABANDONED"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-base"
                    >
                      {statusLabel(attempt.status, locale)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-base">
                    <div className="flex flex-col items-start gap-1.5">
                      {attempt.detailsPurged ? (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground text-base"
                        >
                          {t(locale, "dashboard.attemptDetailsPurged")}
                        </Badge>
                      ) : null}
                      {attempt.detailsPurged ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          disabled
                          title={t(
                            locale,
                            "dashboard.attemptDetailsPurgedDescription",
                          )}
                        >
                          {t(locale, "dashboard.attemptDetailsUnavailable")}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-base"
                          onClick={() => openDetail(attempt.id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {t(locale, "dashboard.viewAttemptDetails")}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </MotionTableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {showLockedZone ? (
          <motion.div
            data-testid="locked-attempts-zone"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              ...ATTEMPTS_TABLE_SPRING,
              delay: prefersReducedMotion
                ? 0
                : headerRowDelay + 0.1 + attempts.length * 0.06,
            }}
            className="relative min-h-[12rem] border-t border-border sm:min-h-44"
          >
            <div className="min-h-[12rem] sm:min-h-44">
              <LockedAttemptsBlurPreview
                rowKeys={lockedPlaceholderKeys}
                locale={locale}
              />
            </div>

            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-6">
              <div className="pointer-events-auto max-w-full space-y-3 rounded-2xl border border-border/80 bg-background/90 px-5 py-4 text-center shadow-sm backdrop-blur-[2px] sm:px-6">
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground sm:text-lg">
                    {lockedAttemptCount === 1
                      ? t(locale, "dashboard.lockedResponsesCountOne")
                      : t(locale, "dashboard.lockedResponsesCount", {
                          count: String(lockedAttemptCount),
                        })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t(locale, "dashboard.unlockGameHint")}
                  </p>
                </div>
                <Button type="button" variant="default" onClick={onUnlockClick}>
                  {t(locale, "dashboard.unlockDialog.unlockResponses")}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </motion.div>

      <QuizAttemptDetailDialog
        attemptId={selectedAttemptId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        resolveError={(error) => resolveAttemptDetailsError(locale, error)}
      />
    </section>
  );
}
