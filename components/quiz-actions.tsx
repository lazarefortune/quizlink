"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye,
  Edit,
  Trash2,
  Copy,
  Share2,
  Check,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { resolveQuizActionError } from "@/lib/quiz/resolveQuizActionError";
import { deleteQuiz, duplicateQuiz } from "@/app/(app)/dashboard/actions";
import { createOrGetQuizLink } from "@/app/quiz-link/actions";
import { canQuizBeShared } from "@/lib/quiz/quizStatusPolicy";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";
import { track } from "@/lib/analytics/track";
import { PARTICIPANT_INVITED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type QuizActionsProps = {
  quizId: string;
  quizName: string;
  quizStatus?: QuizLifecycleStatus;
  onDeleted?: () => void;
  onDuplicated?: (newQuizId: string) => void;
};

export function QuizActions({
  quizId,
  quizName,
  quizStatus = "ACTIVE",
  onDeleted,
  onDuplicated,
}: QuizActionsProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [isLoadingShareLink, setIsLoadingShareLink] = useState(false);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteQuiz(quizId);
      if (result.success) {
        setShowDeleteDialog(false);
        onDeleted?.();
      } else {
        alert(result.error || t(locale, "dashboard.deleteError"));
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      alert(t(locale, "dashboard.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const result = await duplicateQuiz(quizId);
      if (result.success && result.quizId) {
        onDuplicated?.(result.quizId);
        router.push(`/builder/${result.quizId}`);
      } else {
        alert(result.error || t(locale, "dashboard.duplicateError"));
      }
    } catch (error) {
      console.error("Error duplicating quiz:", error);
      alert(t(locale, "dashboard.duplicateError"));
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleShareClick = async () => {
    setShowShareDialog(true);
    setIsLoadingShareLink(true);
    setShareLink("");
    try {
      const result = await createOrGetQuizLink(quizId, true);
      if (result.success) {
        track(PARTICIPANT_INVITED, {
          ...buildCommonEventProps({ isLoggedIn: true, preferredLanguage: locale }),
          quiz_id: quizId,
          delivery: "link",
          is_first_invite_for_quiz: result.isFirstInviteForQuiz,
        });
        setShareLink(`${baseUrl}/quiz/${result.quizLink.token}`);
      } else {
        alert(
          resolveQuizActionError(locale, result.error) ||
            t(locale, "dashboard.shareError"),
        );
        setShowShareDialog(false);
      }
    } catch (error) {
      console.error("Error creating quiz link:", error);
      alert(t(locale, "dashboard.shareError"));
      setShowShareDialog(false);
    } finally {
      setIsLoadingShareLink(false);
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareLink).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleEdit = () => {
    router.push(`/builder/${quizId}`);
  };

  const handleView = () => {
    router.push(`/dashboard/quiz/${quizId}/preview`);
  };

  const isDraft = quizStatus === "DRAFT";
  const isArchived = quizStatus === "ARCHIVED";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {isDraft ? (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={handleEdit}
              className="flex-1 min-w-[100px]"
            >
              <Edit className="h-3 w-3 mr-1" />
              {t(locale, "dashboard.continueInBuilder")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleDuplicate()}
              disabled={isDuplicating}
              className="flex-1 min-w-[100px]"
            >
              <Copy className="h-3 w-3 mr-1" />
              {isDuplicating
                ? t(locale, "common.loading")
                : t(locale, "dashboard.duplicate")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="flex-1 min-w-[100px]"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {t(locale, "dashboard.delete")}
            </Button>
          </>
        ) : isArchived ? (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={handleView}
              className="flex-1 min-w-[100px]"
            >
              <Eye className="h-3 w-3 mr-1" />
              {t(locale, "dashboard.viewArchivedQuiz")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleDuplicate()}
              disabled={isDuplicating}
              className="flex-1 min-w-[100px]"
            >
              <Copy className="h-3 w-3 mr-1" />
              {isDuplicating
                ? t(locale, "common.loading")
                : t(locale, "dashboard.duplicate")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="flex-1 min-w-[100px]"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {t(locale, "dashboard.delete")}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={handleView}
              className="flex-1 min-w-[100px]"
            >
              <Eye className="h-3 w-3 mr-1" />
              {t(locale, "dashboard.view")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleEdit}
              className="flex-1 min-w-[100px]"
            >
              <Edit className="h-3 w-3 mr-1" />
              {t(locale, "dashboard.edit")}
            </Button>
            {canQuizBeShared(quizStatus) ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleShareClick}
                className="flex-1 min-w-[100px]"
              >
                <Share2 className="h-3 w-3 mr-1" />
                {t(locale, "dashboard.share")}
              </Button>
            ) : null}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="flex-1 min-w-[100px]"
            >
              <Copy className="h-3 w-3 mr-1" />
              {isDuplicating
                ? t(locale, "common.loading")
                : t(locale, "dashboard.duplicate")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="flex-1 min-w-[100px]"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {t(locale, "dashboard.delete")}
            </Button>
          </>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onOverlayClick={() => setShowDeleteDialog(false)}>
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
            <AlertDialogCancel>
              {t(locale, "common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className={buttonVariants({ variant: "destructive" })}
            >
              {isDeleting
                ? t(locale, "common.loading")
                : t(locale, "dashboard.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t(locale, "dashboard.sharePlayLinkTitle")}</DialogTitle>
            <DialogDescription>
              {t(locale, "dashboard.sharePlayLinkDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isLoadingShareLink ? (
              <p className="text-sm text-muted-foreground">
                {t(locale, "common.loading")}
              </p>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={shareLink}
                  readOnly
                  className="flex-1 font-mono text-sm"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  onClick={handleCopyLink}
                  variant={linkCopied ? "secondary" : "primary"}
                  size="default"
                  className="shrink-0"
                  disabled={!shareLink}
                >
                  {linkCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {t(locale, "dashboard.copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      {t(locale, "dashboard.copy")}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
