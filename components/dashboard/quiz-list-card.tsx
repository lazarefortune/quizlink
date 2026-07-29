"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { QuizQuotaBar } from "@/components/dashboard/quiz-quota-bar";
import { QuizCardStats } from "@/components/dashboard/quiz-card-stats-icons";
import { QuizStatusBadge } from "@/components/quiz/quiz-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { t, type Locale } from "@/lib/i18n";
import { resolveQuizDisplayName } from "@/lib/quiz/quizNameValidation";
import type { QuizResponseQuotaStatus } from "@/lib/quiz/quizResponseQuotaStatus";
import {
  canQuizBePlayed,
  canQuizBeShared,
  canQuizShowResponseInsights,
} from "@/lib/quiz/quizStatusPolicy";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, Play, Copy01Icon, Edit, Eye} from "@hugeicons/core-free-icons";

export type QuizListCardData = {
  id: string;
  name: string;
  status: QuizLifecycleStatus;
  questionCount: number;
  attemptCount: number;
  quotaStatus?: QuizResponseQuotaStatus;
};

type QuizListCardProps = {
  quiz: QuizListCardData;
  locale: Locale;
  playLoadingQuizId: string | null;
  copyLoadingQuizId?: string | null;
  onPlay: (quizId: string) => void;
  onCopyLink?: (quizId: string) => void;
  onEdit: (quizId: string) => void;
  onView: (quizId: string) => void;
  onDelete?: () => void;
};

function QuizListCardActionsMenu({
  locale,
  ariaLabel,
  children,
}: {
  locale: Locale;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label={ariaLabel ?? t(locale, "dashboard.actionsLabel")}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function QuizListCard({
  quiz,
  locale,
  playLoadingQuizId,
  copyLoadingQuizId = null,
  onPlay,
  onCopyLink,
  onEdit,
  onView,
  onDelete,
}: QuizListCardProps) {
  const isDraft = quiz.status === "DRAFT";
  const isArchived = quiz.status === "ARCHIVED";
  const canShare = canQuizBeShared(quiz.status) && onCopyLink != null;
  const displayQuizName = resolveQuizDisplayName(
    quiz.name,
    t(locale, "dashboard.localDraft.untitledQuiz"),
  );
  const titleHref = isDraft
    ? `/builder/${quiz.id}`
    : `/dashboard/quiz/${quiz.id}?tab=questions`;

  return (
    <Card className="group flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col p-5">
        <Link href={titleHref} className="mb-4 block flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="line-clamp-2 min-w-0 flex-1 text-xl font-medium leading-snug text-zinc-800 transition-colors hover:text-blue dark:text-zinc-200">
              {displayQuizName}
            </h3>
            {quiz.status !== "ACTIVE" ? (
              <QuizStatusBadge status={quiz.status} locale={locale} />
            ) : null}
          </div>
        </Link>

        <QuizCardStats
          locale={locale}
          questionCount={quiz.questionCount}
          attemptCount={quiz.attemptCount}
          showResults={canQuizShowResponseInsights(quiz.status)}
          className="mb-4"
        />

        {quiz.quotaStatus ? (
          <QuizQuotaBar
            quotaStatus={quiz.quotaStatus}
            locale={locale}
            className="mb-3"
            unlockHref={
              quiz.quotaStatus.label === "FREE_LIMIT_REACHED"
                ? `/dashboard/quiz/${quiz.id}?unlock=1`
                : undefined
            }
          />
        ) : null}

        <div className="mt-auto space-y-3 pt-3">
          {canQuizBePlayed(quiz.status) ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2 text-blue"
                onClick={() => onPlay(quiz.id)}
                disabled={playLoadingQuizId !== null}
              >
                {playLoadingQuizId === quiz.id ? (
                  t(locale, "common.loading")
                ) : (
                  <>
                    <HugeiconsIcon icon={Play} size={16} strokeWidth={2.5} />
                    {t(locale, "dashboard.playQuiz")}
                  </>
                )}
              </Button>
              <QuizListCardActionsMenu locale={locale}>
                <DropdownMenuItem
                  onClick={() => onView(quiz.id)}
                  className="gap-2 text-lg"
                >
                  <HugeiconsIcon icon={Eye} size={20} strokeWidth={1.7} />
                  {t(locale, "dashboard.viewQuizMenu")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onEdit(quiz.id)}
                  className="gap-2 text-lg"
                >
                  <HugeiconsIcon icon={Edit} size={20} strokeWidth={1.7} />
                  {t(locale, "dashboard.edit")}
                </DropdownMenuItem>
                {canShare ? (
                  <DropdownMenuItem
                    onClick={() => onCopyLink(quiz.id)}
                    disabled={copyLoadingQuizId !== null}
                    className="gap-2 text-lg"
                  >
                    <HugeiconsIcon
                      icon={Copy01Icon}
                      size={20}
                      strokeWidth={1.7}
                    />
                    {copyLoadingQuizId === quiz.id
                      ? t(locale, "common.loading")
                      : t(locale, "dashboard.copyQuizLinkMenu")}
                  </DropdownMenuItem>
                ) : null}
                {onDelete ? (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="gap-2 text-lg text-destructive focus:text-destructive"
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      size={20}
                      strokeWidth={1.7}
                    />
                    {t(locale, "dashboard.delete")}
                  </DropdownMenuItem>
                ) : null}
              </QuizListCardActionsMenu>
            </div>
          ) : null}

          {isDraft ? (
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant="outlineBlue"
                  size="sm"
                  className="flex-1 gap-2"
                  asChild
                >
                  <Link href={`/builder/${quiz.id}`}>
                    <HugeiconsIcon icon={Edit} size={20} strokeWidth={1.7} />
                    {t(locale, "dashboard.continueInBuilder")}
                  </Link>
                </Button>
                {onDelete ? (
                  <QuizListCardActionsMenu locale={locale}>
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <HugeiconsIcon
                        icon={Delete02Icon}
                        size={20}
                        strokeWidth={1.7}
                      />
                      {t(locale, "dashboard.delete")}
                    </DropdownMenuItem>
                  </QuizListCardActionsMenu>
                ) : null}
              </div>
            </>
          ) : null}

          {isArchived ? (
            <div className="flex items-center gap-2">
              <Button variant="blue" size="sm" className="flex-1 gap-2" asChild>
                <Link href={`/dashboard/quiz/${quiz.id}?tab=questions`}>
                  <HugeiconsIcon icon={Eye} size={20} strokeWidth={1.7} />
                  {t(locale, "dashboard.viewArchivedQuiz")}
                </Link>
              </Button>
              <QuizListCardActionsMenu locale={locale}>
                <DropdownMenuItem
                  onClick={() => onView(quiz.id)}
                  className="gap-2 text-lg font-medium"
                >
                  <HugeiconsIcon icon={Eye} size={20} strokeWidth={1.7} />
                  {t(locale, "dashboard.viewQuizMenu")}
                </DropdownMenuItem>
                {onDelete ? (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="gap-2 text-lg font-medium text-destructive focus:text-destructive"
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      size={20}
                      strokeWidth={1.7}
                    />
                    {t(locale, "dashboard.delete")}
                  </DropdownMenuItem>
                ) : null}
              </QuizListCardActionsMenu>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
