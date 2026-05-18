"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Copy,
  Edit,
  Eye,
  MoreVertical,
  Pencil,
  Play,
  Share2,
  Trash2,
} from "lucide-react";

import { duplicateQuiz, deleteQuiz } from "@/app/(app)/dashboard/actions";
import { createOrGetQuizLink } from "@/app/quiz-link/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { FullscreenBlockingOverlay } from "@/components/ui/fullscreen-blocking-overlay";
import { QuizStatusBadge } from "@/components/quiz/quiz-status-badge";
import { useToast } from "@/components/ui/toast";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import { track } from "@/lib/analytics/track";
import { PARTICIPANT_INVITED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";
import { resolveQuizActionError } from "@/lib/quiz/resolveQuizActionError";
import { canQuizBePlayed } from "@/lib/quiz/quizStatusPolicy";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";
import { cn } from "@/lib/utils";

import { QuizShareLinkDialog } from "./quiz-share-link-dialog";

type QuizDetailHeaderProps = {
  quizId: string;
  quizName: string;
  quizStatus: QuizLifecycleStatus;
};

export function QuizDetailHeader({
  quizId,
  quizName,
  quizStatus,
}: QuizDetailHeaderProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const [playLoading, setPlayLoading] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const canPlay = canQuizBePlayed(quizStatus);

  const handlePlay = async () => {
    setPlayLoading(true);
    try {
      const result = await createOrGetQuizLink(quizId, true);
      if (result.success) {
        track(PARTICIPANT_INVITED, {
          ...buildCommonEventProps({ isLoggedIn: true, preferredLanguage: locale }),
          quiz_id: quizId,
          delivery: "link",
          is_first_invite_for_quiz: result.isFirstInviteForQuiz,
        });
        router.push(`/quiz/${result.quizLink.token}`);
      } else {
        showToast(
          resolveQuizActionError(locale, result.error) ||
            t(locale, "dashboard.shareError"),
          "error",
        );
      }
    } catch {
      showToast(t(locale, "dashboard.shareError"), "error");
    } finally {
      setPlayLoading(false);
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const result = await duplicateQuiz(quizId);
      if (result.success && result.quizId) {
        router.push(`/builder/${result.quizId}`);
      } else {
        showToast(result.error || t(locale, "dashboard.duplicateError"), "error");
      }
    } catch {
      showToast(t(locale, "dashboard.duplicateError"), "error");
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteQuiz(quizId);
      if (result.success) {
        showToast(t(locale, "dashboard.quizDeletedSuccess"), "success");
        router.push("/dashboard/quizzes");
      } else {
        showToast(result.error || t(locale, "dashboard.deleteError"), "error");
      }
    } catch {
      showToast(t(locale, "dashboard.deleteError"), "error");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const primaryAction =
    quizStatus === "DRAFT" ? (
      <Button variant="blue" size="sm" className="gap-2" asChild>
        <Link href={`/builder/${quizId}`}>
          <Edit className="h-4 w-4" />
          <span className="hidden sm:inline">{t(locale, "dashboard.continueInBuilder")}</span>
          <span className="sm:hidden">{t(locale, "dashboard.edit")}</span>
        </Link>
      </Button>
    ) : canPlay ? (
      <Button
        variant="blue"
        size="sm"
        className="gap-2"
        onClick={() => void handlePlay()}
        disabled={playLoading}
      >
        <Play className="h-4 w-4" />
        <span className="hidden sm:inline">
          {playLoading ? t(locale, "common.loading") : t(locale, "dashboard.playQuiz")}
        </span>
        <span className="sm:hidden">
          {playLoading ? t(locale, "common.loading") : t(locale, "dashboard.playQuiz")}
        </span>
      </Button>
    ) : quizStatus === "ARCHIVED" ? (
      <Button variant="blue" size="sm" className="gap-2" asChild>
        <Link href={`/dashboard/quiz/${quizId}?tab=questions`}>
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">{t(locale, "dashboard.viewArchivedQuiz")}</span>
          <span className="sm:hidden">{t(locale, "dashboard.view")}</span>
        </Link>
      </Button>
    ) : null;

  return (
    <>
      <header className="space-y-4">
        <Link href="/dashboard/quizzes">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t(locale, "dashboard.backToMyQuizzes")}
          </Button>
        </Link>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {quizName}
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-start">
              {primaryAction}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 sm:hidden"
                aria-label={t(locale, "dashboard.share")}
                onClick={() => setShowShareDialog(true)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hidden gap-2 sm:inline-flex"
                onClick={() => setShowShareDialog(true)}
              >
                <Share2 className="h-4 w-4" />
                {t(locale, "dashboard.share")}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    aria-label={t(locale, "dashboard.quizActionsMenu")}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {quizStatus === "ACTIVE" ? (
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/builder/${quizId}`}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        {t(locale, "dashboard.editQuiz")}
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  {quizStatus === "DRAFT" ? (
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/builder/${quizId}`}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        {t(locale, "dashboard.editQuiz")}
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  {quizStatus === "ARCHIVED" ? (
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/dashboard/quiz/${quizId}?tab=questions`}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        {t(locale, "dashboard.viewArchivedQuiz")}
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem
                    className="flex cursor-pointer items-center gap-2"
                    disabled={isDuplicating}
                    onSelect={() => void handleDuplicate()}
                  >
                    <Copy className="h-4 w-4" />
                    {isDuplicating
                      ? t(locale, "common.loading")
                      : t(locale, "dashboard.duplicate")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
                    onSelect={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t(locale, "dashboard.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <QuizShareLinkDialog
        quizId={quizId}
        quizStatus={quizStatus}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(locale, "dashboard.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(locale, "dashboard.deleteConfirmDescription", {
                name: quizName,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t(locale, "common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className={cn(
                buttonVariants({ variant: "destructive" }),
                "focus-visible:ring-destructive",
              )}
            >
              {isDeleting
                ? t(locale, "common.loading")
                : t(locale, "dashboard.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FullscreenBlockingOverlay
        open={playLoading}
        title={t(locale, "dashboard.blockingOpenQuizTitle")}
        description={t(locale, "dashboard.blockingOpenQuizDescription")}
      />
    </>
  );
}
