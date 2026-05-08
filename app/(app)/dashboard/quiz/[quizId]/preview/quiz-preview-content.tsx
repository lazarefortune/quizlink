"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, Copy, Pencil, Play } from "lucide-react";

import type { QuizContentQuestion } from "../actions";
import { createOrGetQuizLink } from "@/app/quiz-link/actions";
import { track } from "@/lib/analytics/track";
import { PARTICIPANT_INVITED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type QuizPreviewContentProps = {
  quizId: string;
  quizName: string;
  questions: QuizContentQuestion[];
};

function questionTypeLabel(type: string, locale: string): string {
  if (type === "MULTIPLE_CHOICE") return locale === "fr" ? "QCM" : "Single choice";
  if (type === "CHECKBOX") return locale === "fr" ? "Choix multiples" : "Multiple choice";
  if (type === "TRUE_FALSE") return locale === "fr" ? "Vrai ou Faux" : "True / False";
  return type;
}

export function QuizPreviewContent({
  quizId,
  quizName,
  questions,
}: QuizPreviewContentProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const [playLoading, setPlayLoading] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";

  const getShareUrl = async (): Promise<string | null> => {
    const result = await createOrGetQuizLink(quizId, true);
    if (!result.success || !baseUrl) {
      showToast(result.success ? t(locale, "dashboard.shareError") : result.error, "error");
      return null;
    }

    track(PARTICIPANT_INVITED, {
      ...buildCommonEventProps({ isLoggedIn: true, preferredLanguage: locale }),
      quiz_id: quizId,
      delivery: "link",
      is_first_invite_for_quiz: result.isFirstInviteForQuiz,
    });

    return `${baseUrl}/quiz/${result.quizLink.token}`;
  };

  const handlePlay = async () => {
    setPlayLoading(true);
    try {
      const shareUrl = await getShareUrl();
      if (shareUrl) {
        window.open(shareUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setPlayLoading(false);
    }
  };

  const handleCopyLink = async () => {
    setCopyLoading(true);
    try {
      const shareUrl = await getShareUrl();
      if (!shareUrl) return;
      await navigator.clipboard.writeText(shareUrl);
      showToast(t(locale, "dashboard.linkCopied"), "success");
    } catch (error) {
      console.error("Error copying quiz link:", error);
      showToast(t(locale, "dashboard.shareError"), "error");
    } finally {
      setCopyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Link href="/dashboard/quizzes">
                <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t(locale, "dashboard.backToMyQuizzes")}
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{quizName}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {questions.length}{" "}
                  {questions.length === 1
                    ? t(locale, "dashboard.question")
                    : t(locale, "dashboard.questions")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleCopyLink}
                disabled={copyLoading}
              >
                <Copy className="h-4 w-4" />
                {copyLoading ? t(locale, "common.loading") : t(locale, "dashboard.copyLink")}
              </Button>
              <Button
                variant="blue"
                size="sm"
                className="gap-2"
                onClick={handlePlay}
                disabled={playLoading}
              >
                <Play className="h-4 w-4" />
                {playLoading ? t(locale, "common.loading") : t(locale, "dashboard.testQuiz")}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => router.push(`/builder/${quizId}`)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                {t(locale, "dashboard.editQuiz")}
              </Button>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          {questions.map((question, index) => (
            <article key={question.id} className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {t(locale, "dashboard.questionLabel")} {index + 1}
                </Badge>
                <Badge variant="secondary">
                  {questionTypeLabel(question.type, locale)}
                </Badge>
              </div>

              <p className="text-base font-semibold text-foreground sm:text-lg">{question.label}</p>

              {question.image && (
                <div className="mt-4 overflow-hidden rounded-lg border border-border">
                  <Image
                    src={question.image}
                    alt={question.label}
                    width={1200}
                    height={675}
                    className="h-auto w-full object-cover"
                  />
                </div>
              )}

              <ul className="mt-4 space-y-2">
                {question.options.map((option) => (
                  <li
                    key={option.id}
                    className="flex items-start gap-2 rounded-md border border-border/70 px-3 py-2"
                  >
                    {option.isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                    )}
                    <span className={option.isCorrect ? "font-medium text-foreground" : "text-muted-foreground"}>
                      {option.label}
                    </span>
                  </li>
                ))}
              </ul>

              {question.explanation?.trim() && (
                <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {t(locale, "builder.explanationLabel")}:
                  </span>{" "}
                  {question.explanation.trim()}
                </div>
              )}
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
