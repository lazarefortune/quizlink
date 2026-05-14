"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart2, CheckCircle2, Circle, Copy, Pencil, Play, Trash2 } from "lucide-react";

import type { QuizContentQuestion } from "../actions";
import { createOrGetQuizLink } from "@/app/quiz-link/actions";
import { deleteQuiz } from "@/app/(app)/dashboard/actions";
import { track } from "@/lib/analytics/track";
import { PARTICIPANT_INVITED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";
import { useLocale } from "@/lib/i18n/use-locale";
import { t, type Locale } from "@/lib/i18n";
import { getQuestionImageSrc } from "@/lib/question-image-src";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

type QuizPreviewContentProps = {
  quizId: string;
  quizName: string;
  questions: QuizContentQuestion[];
};

function questionTypeLabel(type: string, locale: Locale): string {
  if (type === "MULTIPLE_CHOICE") return t(locale, "builder.questionTypeMultipleChoice");
  if (type === "CHECKBOX") return t(locale, "builder.questionTypeCheckbox");
  if (type === "TRUE_FALSE") return t(locale, "builder.questionTypeTrueFalse");
  return type;
}

async function writeToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        showToast(result.error || t(locale, "dashboard.shareError"), "error");
      }
    } catch (error) {
      console.error("Error getting quiz link:", error);
      showToast(t(locale, "dashboard.shareError"), "error");
    } finally {
      setPlayLoading(false);
    }
  };

  const handleCopyLink = async () => {
    setCopyLoading(true);
    try {
      const result = await createOrGetQuizLink(quizId, true);
      if (!result.success) {
        showToast(result.error || t(locale, "dashboard.shareError"), "error");
        return;
      }
      track(PARTICIPANT_INVITED, {
        ...buildCommonEventProps({ isLoggedIn: true, preferredLanguage: locale }),
        quiz_id: quizId,
        delivery: "link",
        is_first_invite_for_quiz: result.isFirstInviteForQuiz,
      });
      const shareUrl = `${window.location.origin}/quiz/${result.quizLink.token}`;
      await writeToClipboard(shareUrl);
      showToast(t(locale, "dashboard.linkCopied"), "success");
    } catch (error) {
      console.error("Error copying quiz link:", error);
      showToast(t(locale, "dashboard.shareError"), "error");
    } finally {
      setCopyLoading(false);
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
    } catch (error) {
      console.error("Error deleting quiz:", error);
      showToast(t(locale, "dashboard.deleteError"), "error");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="min-h-0 w-full bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/dashboard/quizzes">
            <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t(locale, "dashboard.backToMyQuizzes")}
            </Button>
        </Link>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{quizName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span>
                    {questions.length}{" "}
                    {questions.length === 1
                        ? t(locale, "dashboard.question")
                        : t(locale, "dashboard.questions")}
                    </span>
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
              <Link href={`/dashboard/quiz/${quizId}`}>
                <Button variant="secondary" size="sm" className="gap-2">
                  <BarChart2 className="h-4 w-4" />
                  {t(locale, "dashboard.viewAnswers")}
                </Button>
              </Link>
              <Button
                variant="default"
                size="sm"
                onClick={() => router.push(`/builder/${quizId}`)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                {t(locale, "dashboard.editQuiz")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
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

              {(() => {
                const imageSrc = getQuestionImageSrc({
                  image: question.image,
                  imageKey: question.imageKey,
                });
                if (!imageSrc) {
                  return null;
                }
                return (
                <div className="mt-4 overflow-hidden rounded-lg border border-border">
                  <Image
                    src={imageSrc}
                    alt={question.label}
                    width={1200}
                    height={675}
                    className="h-auto w-full object-cover"
                  />
                </div>
                );
              })()}

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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(locale, "dashboard.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(locale, "dashboard.deleteConfirmDescription", { name: quizName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t(locale, "common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground btn-bouncy-destructive hover:bg-destructive/90 focus-visible:ring-destructive"
            >
              {isDeleting ? t(locale, "common.loading") : t(locale, "dashboard.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
