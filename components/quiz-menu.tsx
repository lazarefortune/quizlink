"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Share2, Trash2, Check, Copy } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMinWidthLg } from "@/lib/builder/useMinWidthLg";
import { cn } from "@/lib/utils";

type QuizMenuProps = {
  quizId: string;
  quizName: string;
  quizStatus: QuizLifecycleStatus;
  onDeleted?: () => void;
  onDuplicated?: (newQuizId: string) => void;
  /** When true, share is an outline icon button next to the ⋮ menu (builder header). */
  elevateShareButton?: boolean;
};

export function QuizMenu({
  quizId,
  quizName,
  quizStatus,
  onDeleted,
  onDuplicated,
  elevateShareButton = false,
}: QuizMenuProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const isLargeViewport = useMinWidthLg();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareLink, setShareLink] = useState<string>("");
  const [isLoadingLink, setIsLoadingLink] = useState(false);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const handleShareClick = async () => {
    setMobileSheetOpen(false);
    setIsLoadingLink(true);
    setShowShareDialog(true);

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
      setIsLoadingLink(false);
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareLink).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      });
    } else {
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

  const handleDuplicate = async () => {
    setMobileSheetOpen(false);
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteQuiz(quizId);
      if (result.success) {
        setShowDeleteDialog(false);
        setMobileSheetOpen(false);
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

  const openDeleteFlow = () => {
    setMobileSheetOpen(false);
    setShowDeleteDialog(true);
  };

  const triggerLabel = t(locale, "builder.questionActionsMenu");

  const actionRowClass =
    "flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-base transition-colors hover:bg-accent";

  const overflowMenu = isLargeViewport ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0" aria-label={triggerLabel}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {!elevateShareButton && canQuizBeShared(quizStatus) ? (
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2 text-base"
            onSelect={() => {
              void handleShareClick();
            }}
          >
            <Share2 className="h-4 w-4" />
            {t(locale, "dashboard.share")}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 text-base"
          disabled={isDuplicating}
          onSelect={() => {
            void handleDuplicate();
          }}
        >
          <Copy className="h-4 w-4" />
          {isDuplicating ? t(locale, "common.loading") : t(locale, "dashboard.duplicate")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 text-base text-destructive focus:text-destructive"
          onSelect={openDeleteFlow}
        >
          <Trash2 className="h-4 w-4" />
          {t(locale, "dashboard.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0"
        aria-label={triggerLabel}
        aria-expanded={mobileSheetOpen}
        onClick={() => setMobileSheetOpen(true)}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent
          side="bottom"
          showCloseButton
          className={cn(
            "builder-scrollbar max-h-[min(70vh,28rem)] overflow-y-auto rounded-t-2xl p-0",
            "pb-[max(1rem,env(safe-area-inset-bottom))]",
          )}
        >
          <SheetHeader className="border-b border-border/60 px-4 pb-3 pt-6 text-left">
            <SheetTitle className="text-lg">{t(locale, "builder.quizActionsSheetTitle")}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-3 py-3">
            {!elevateShareButton && canQuizBeShared(quizStatus) ? (
              <button
                type="button"
                className={actionRowClass}
                onClick={() => {
                  void handleShareClick();
                }}
              >
                <Share2 className="h-5 w-5 shrink-0" />
                {t(locale, "dashboard.share")}
              </button>
            ) : null}
            <button
              type="button"
              className={actionRowClass}
              disabled={isDuplicating}
              onClick={() => void handleDuplicate()}
            >
              <Copy className="h-5 w-5 shrink-0" />
              {isDuplicating ? t(locale, "common.loading") : t(locale, "dashboard.duplicate")}
            </button>
            <button type="button" className={cn(actionRowClass, "text-destructive")} onClick={openDeleteFlow}>
              <Trash2 className="h-5 w-5 shrink-0" />
              {t(locale, "dashboard.delete")}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );

  const shareIconButton =
    elevateShareButton && canQuizBeShared(quizStatus) ? (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
        aria-label={t(locale, "dashboard.share")}
        title={t(locale, "dashboard.share")}
        disabled={isLoadingLink}
        onClick={() => void handleShareClick()}
      >
        <Share2 className="h-4 w-4" />
      </Button>
    ) : null;

  const menuShell = <div className="relative shrink-0">{overflowMenu}</div>;

  return (
    <>
      {elevateShareButton ? (
        <div className="flex shrink-0 items-center gap-2">
          {shareIconButton}
          {menuShell}
        </div>
      ) : (
        menuShell
      )}

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
        <DialogContent
          onOverlayClick={() => setShowShareDialog(false)}
          className="sm:max-w-xl"
        >
          <DialogHeader>
            <DialogTitle>{t(locale, "dashboard.sharePlayLinkTitle")}</DialogTitle>
            <DialogDescription>
              {t(locale, "dashboard.sharePlayLinkDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isLoadingLink ? (
              <p className="text-sm text-muted-foreground">
                {t(locale, "common.loading")}
              </p>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={shareLink}
                  readOnly
                  className="flex-1 text-base"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  onClick={handleCopyLink}
                  variant={linkCopied ? "secondary" : "primary"}
                  size="default"
                  className="shrink-0"
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
