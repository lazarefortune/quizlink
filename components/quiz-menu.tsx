"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Share2, Trash2, Check, Lock, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { deleteQuiz } from "@/app/(app)/dashboard/actions";
import { createOrGetQuizLink } from "@/app/quiz-link/actions";
import { track } from "@/lib/analytics/track";
import { PARTICIPANT_INVITED } from "@/lib/analytics/events";
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

type QuizMenuProps = {
  quizId: string;
  quizName: string;
  visibility: "PRIVATE" | "PUBLIC";
  onDeleted?: () => void;
};

export function QuizMenu({
  quizId,
  quizName,
  visibility,
  onDeleted,
}: QuizMenuProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareLink, setShareLink] = useState<string>("");
  const [isLoadingLink, setIsLoadingLink] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const handleShareClick = async () => {
    setIsOpen(false);
    setIsLoadingLink(true);
    setShowShareDialog(true);

    try {
      const result = await createOrGetQuizLink(quizId, true);
      if (result.success) {
        track(PARTICIPANT_INVITED, { quizId, linkId: result.quizLink.id });
        setShareLink(`${baseUrl}/quiz/${result.quizLink.token}`);
      } else {
        alert(result.error || t(locale, "dashboard.shareError"));
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteQuiz(quizId);
      if (result.success) {
        setShowDeleteDialog(false);
        setIsOpen(false);
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

  return (
    <>
      <div className="relative" ref={menuRef}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="shrink-0"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>

        {isOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-popover shadow-lg z-50" onClick={(e) => e.stopPropagation()}>
              <div className="p-1">
                {visibility === "PUBLIC" ? (
                  <button
                    onClick={handleShareClick}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors text-left"
                  >
                    <Share2 className="h-4 w-4" />
                    {t(locale, "dashboard.share")}
                  </button>
                ) : (
                  <div
                    className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground rounded-md"
                    title={t(locale, "dashboard.privateQuiz")}
                  >
                    <Lock className="h-4 w-4" />
                    {t(locale, "dashboard.private")}
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowDeleteDialog(true);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors text-left text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  {t(locale, "dashboard.delete")}
                </button>
              </div>
            </div>
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting
                ? t(locale, "common.loading")
                : t(locale, "dashboard.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent onOverlayClick={() => setShowShareDialog(false)}>
          <DialogHeader>
            <DialogTitle>{t(locale, "dashboard.publicPlayLinkTitle")}</DialogTitle>
            <DialogDescription>
              {t(locale, "dashboard.publicPlayLinkDescription")}
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
                  className="flex-1 font-mono text-sm"
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
