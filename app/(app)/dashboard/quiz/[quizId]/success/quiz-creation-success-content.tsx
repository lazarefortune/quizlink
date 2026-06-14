"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, Library, Pencil } from "lucide-react";

import { createOrGetQuizLink } from "@/app/quiz-link/actions";
import {
  QuizCreationSuccessShareLinkIcon,
  QuizCreationSuccessStarsIcon,
  QuizCreationSuccessTrophyIcon,
} from "@/app/(app)/dashboard/quiz/[quizId]/success/quiz-creation-success-icons";
import { ParticipantIdentityModeSelector } from "@/components/dashboard/participant-identity-mode-selector";
import { Button } from "@/components/ui/button";
import { FullscreenBlockingOverlay } from "@/components/ui/fullscreen-blocking-overlay";
import { Input } from "@/components/ui/input";
import { QuizCreationFeedbackCard } from "@/components/user-feedback/quiz-creation-feedback-card";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import { resolveQuizActionError } from "@/lib/quiz/resolveQuizActionError";
import type { ParticipantIdentityMode } from "@/types/participant-identity";

type QuizCreationSuccessContentProps = {
  quizId: string;
  quizName: string;
  questionCount?: number;
  quizStatus?: string;
  participantIdentityMode: ParticipantIdentityMode;
};

type SuccessSectionHeadingProps = {
  title: string;
  description?: string;
};

function SuccessSectionHeading({
  title,
  description,
}: SuccessSectionHeadingProps) {
  return (
    <div className="space-y-1">
      <h2 className="text-2xl font-semibold text-zinc-700 dark:text-zinc-300">{title}</h2>
      {description ? (
        <p className="text-base leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
      ) : null}
    </div>
  );
}

export function QuizCreationSuccessContent({
  quizId,
  quizName,
  questionCount,
  quizStatus,
  participantIdentityMode,
}: QuizCreationSuccessContentProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const [isLoadingLink, setIsLoadingLink] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  const baseUrl = useMemo(
    () =>
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const loadShareLink = async () => {
      setIsLoadingLink(true);
      setLinkError(null);

      try {
        const result = await createOrGetQuizLink(quizId, true);
        if (!isMounted) return;

        if (!result.success) {
          setLinkError(
            resolveQuizActionError(locale, result.error) ||
              t(locale, "dashboard.unableToCreateShareLink"),
          );
          setShareLink("");
          return;
        }

        setShareLink(`${baseUrl}/quiz/${result.quizLink.token}`);
      } catch {
        if (!isMounted) return;
        setLinkError(t(locale, "dashboard.unableToCreateShareLink"));
        setShareLink("");
      } finally {
        if (isMounted) {
          setIsLoadingLink(false);
        }
      }
    };

    void loadShareLink();

    return () => {
      isMounted = false;
    };
  }, [baseUrl, locale, quizId]);

  const handleCopy = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setLinkError(t(locale, "dashboard.unableToCreateShareLink"));
    }
  };

  const handleTestQuiz = () => {
    if (!shareLink) return;
    window.open(shareLink, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background p-4 sm:p-8">
      <FullscreenBlockingOverlay
        open={isLoadingLink}
        title={t(locale, "dashboard.blockingPrepareLinkTitle")}
        description={t(locale, "dashboard.blockingPrepareLinkDescription")}
      />

      <div className="mx-auto max-w-2xl space-y-8">
        <header className="relative overflow-hidden rounded-2xl border border-border bg-card px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <QuizCreationSuccessTrophyIcon className="h-10 w-10" />
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-foreground sm:text-3xl">
                {t(locale, "dashboard.quizReadyTitle")}
              </h1>
              <p className="text-base leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t(locale, "dashboard.quizReadyDescription", { quizName })}
              </p>
            </div>
          </div>
        </header>

        <section className="space-y-3" data-testid="quiz-creation-share-section">
          <SuccessSectionHeading
            title={t(locale, "dashboard.sharePlayLinkTitle")}
            description={t(locale, "dashboard.sharePlayLinkDescription")}
          />
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={isLoadingLink ? t(locale, "dashboard.loadingShareLink") : shareLink}
                readOnly
                className="text-lg"
                onClick={(event) => (event.target as HTMLInputElement).select()}
              />
              <Button
                onClick={handleCopy}
                variant={isCopied ? "secondary" : "primary"}
                disabled={!shareLink || isLoadingLink}
                className="shrink-0"
              >
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    {t(locale, "dashboard.copied")}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    {t(locale, "dashboard.copy")}
                  </>
                )}
              </Button>
            </div>
            {linkError ? (
              <p className="mt-3 text-sm text-destructive">{linkError}</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <ParticipantIdentityModeSelector
            quizId={quizId}
            value={participantIdentityMode}
            locale={locale}
          />
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <Button
            variant="blue"
            size="lg"
            className="h-auto flex-col gap-2 px-3 py-4 normal-case tracking-normal"
            onClick={handleTestQuiz}
            disabled={!shareLink || isLoadingLink}
          >
            <ExternalLink className="h-5 w-5" />
              <span className="text-center text-base font-semibold leading-snug">
              {t(locale, "dashboard.playQuiz")}
            </span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="h-auto flex-col gap-2 px-3 py-4 normal-case tracking-normal"
            onClick={() => router.push(`/builder/${quizId}`)}
          >
            <Pencil className="h-5 w-5" />
            <span className="text-center text-base font-semibold leading-snug">
              {t(locale, "dashboard.editQuiz")}
            </span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="h-auto flex-col gap-2 px-3 py-4 normal-case tracking-normal"
            onClick={() => router.push("/dashboard/quizzes")}
          >
            <Library className="h-5 w-5" />
            <span className="text-center text-base font-semibold leading-snug">
              {t(locale, "dashboard.seeMyQuizzes")}
            </span>
          </Button>
        </section>

        <QuizCreationFeedbackCard
          quizId={quizId}
          questionCount={questionCount}
          quizStatus={quizStatus}
        />
      </div>
    </div>
  );
}
