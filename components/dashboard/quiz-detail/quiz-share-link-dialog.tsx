"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import { createOrGetQuizLink } from "@/app/quiz-link/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import { track } from "@/lib/analytics/track";
import { PARTICIPANT_INVITED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";
import { resolveQuizActionError } from "@/lib/quiz/resolveQuizActionError";
import { canQuizBeShared } from "@/lib/quiz/quizStatusPolicy";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

type QuizShareLinkDialogProps = {
  quizId: string;
  quizStatus: QuizLifecycleStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canAcceptResponses?: boolean;
  onUnlock?: () => void;
};

export function QuizShareLinkDialog({
  quizId,
  quizStatus,
  open,
  onOpenChange,
  canAcceptResponses = true,
  onUnlock,
}: QuizShareLinkDialogProps) {
  const { locale } = useLocale();
  const [shareLink, setShareLink] = useState("");
  const [isLoadingLink, setIsLoadingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isShareable = canQuizBeShared(quizStatus);
  const canCopyLink = isShareable && canAcceptResponses;
  const hasReachedFreeLimit = isShareable && !canAcceptResponses;

  useEffect(() => {
    if (!open) {
      setShareLink("");
      setLoadError(null);
      setLinkCopied(false);
      return;
    }
    if (!canCopyLink) {
      return;
    }

    let cancelled = false;
    const loadShareLink = async () => {
      setIsLoadingLink(true);
      setLoadError(null);
      try {
        const result = await createOrGetQuizLink(quizId, true);
        if (cancelled) {
          return;
        }
        if (result.success) {
          track(PARTICIPANT_INVITED, {
            ...buildCommonEventProps({ isLoggedIn: true, preferredLanguage: locale }),
            quiz_id: quizId,
            delivery: "link",
            is_first_invite_for_quiz: result.isFirstInviteForQuiz,
          });
          const origin =
            typeof window !== "undefined"
              ? window.location.origin
              : process.env.NEXT_PUBLIC_APP_URL || "";
          setShareLink(`${origin}/quiz/${result.quizLink.token}`);
        } else {
          setLoadError(
            resolveQuizActionError(locale, result.error) ||
              t(locale, "dashboard.shareError"),
          );
        }
      } catch {
        if (!cancelled) {
          setLoadError(t(locale, "dashboard.shareError"));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingLink(false);
        }
      }
    };

    void loadShareLink();
    return () => {
      cancelled = true;
    };
  }, [open, canCopyLink, quizId, locale]);

  const handleCopyLink = async () => {
    if (!shareLink || !canAcceptResponses) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareLink);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareLink;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleUnlock = () => {
    onOpenChange(false);
    onUnlock?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold leading-none tracking-tight">{t(locale, "dashboard.sharePlayLinkTitle")}</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {hasReachedFreeLimit
              ? t(locale, "dashboard.quizQuota.limitReached")
              : isShareable
                ? t(locale, "dashboard.sharePlayLinkDescription")
                : t(locale, "dashboard.shareRequiresActiveQuiz")}
          </DialogDescription>
        </DialogHeader>
        {!isShareable ? (
          <p className="text-base text-muted-foreground">
            {t(locale, "dashboard.draftFinishToShareHint")}
          </p>
        ) : hasReachedFreeLimit ? (
          onUnlock ? (
            <Button type="button" variant="blue" className="w-full" onClick={handleUnlock}>
              {t(locale, "dashboard.quizQuota.unlockToShare")}
            </Button>
          ) : null
        ) : isLoadingLink ? (
          <p className="text-base text-muted-foreground">{t(locale, "common.loading")}</p>
        ) : loadError ? (
          <p className="text-base text-destructive">{loadError}</p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={shareLink}
              readOnly
              className="flex-1 text-base"
              onClick={(event) => (event.target as HTMLInputElement).select()}
            />
            <Button
              type="button"
              variant={linkCopied ? "secondary" : "default"}
              className="shrink-0 gap-2"
              onClick={() => void handleCopyLink()}
              disabled={!shareLink}
            >
              {linkCopied ? (
                <>
                  <Check className="h-4 w-4" />
                  {t(locale, "dashboard.copied")}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  {t(locale, "dashboard.copyLink")}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
