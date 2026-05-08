"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, Pencil } from "lucide-react";

import { createOrGetQuizLink } from "@/app/quiz-link/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

type QuizCreationSuccessContentProps = {
  quizId: string;
  quizName: string;
};

export function QuizCreationSuccessContent({
  quizId,
  quizName,
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
    []
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
          setLinkError(result.error || t(locale, "dashboard.unableToCreateShareLink"));
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
    <div className="min-h-[calc(100vh-4rem)] bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
        <h1 className="text-2xl font-black sm:text-3xl">
          {t(locale, "dashboard.quizReadyTitle")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t(locale, "dashboard.quizReadyDescription", { quizName })}
        </p>

        <div className="mt-6 space-y-3">
          <label className="text-sm font-semibold text-foreground">
            {t(locale, "dashboard.sharePlayLinkTitle")}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={isLoadingLink ? t(locale, "dashboard.loadingShareLink") : shareLink}
              readOnly
              className="font-mono text-sm"
              onClick={(event) => (event.target as HTMLInputElement).select()}
            />
            <Button
              onClick={handleCopy}
              variant={isCopied ? "secondary" : "primary"}
              disabled={!shareLink || isLoadingLink}
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
            <p className="text-sm text-destructive">{linkError}</p>
          ) : null}
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Button
            variant="blue"
            onClick={handleTestQuiz}
            disabled={!shareLink || isLoadingLink}
          >
            <ExternalLink className="h-4 w-4" />
            {t(locale, "dashboard.testQuiz")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push(`/builder/${quizId}`)}
          >
            <Pencil className="h-4 w-4" />
            {t(locale, "dashboard.editQuiz")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push("/dashboard/quizzes")}
            className="sm:col-span-2"
          >
            {t(locale, "dashboard.seeMyQuizzes")}
          </Button>
        </div>
      </div>
    </div>
  );
}
