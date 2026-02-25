"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Pencil, CheckCircle2, Circle } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import type { QuizContentQuestion } from "./actions";
import { QuizStatsTab } from "./quiz-stats-tab";

type QuizDetailContentProps = {
  quizId: string;
  quizName: string;
  visibility: string;
  questions: QuizContentQuestion[];
  stats: {
    totalQuestions: number;
    enrolledParticipantsCount: number;
    participants: Array<{
      id: string;
      name: string;
      email: string | null;
      attemptsCount: number;
      lastScore: number | null;
      lastAttemptDate: Date | null;
    }>;
    anonymousAttemptsCount: number;
    attempts: Array<{
      id: string;
      participantName: string;
      isAnonymous: boolean;
      score: number | null;
      duration: number | null;
      status: string;
      startedAt: Date;
      finishedAt: Date | null;
    }>;
  };
};

function questionTypeLabel(type: string, locale: string): string {
  if (type === "MULTIPLE_CHOICE") return locale === "fr" ? "Choix unique" : "Single choice";
  if (type === "CHECKBOX") return locale === "fr" ? "Choix multiples" : "Multiple choice";
  if (type === "TRUE_FALSE") return locale === "fr" ? "Vrai / Faux" : "True / False";
  return type;
}

export function QuizDetailContent({
  quizId,
  quizName,
  visibility,
  questions,
  stats,
}: QuizDetailContentProps) {
  const router = useRouter();
  const { locale } = useLocale();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/dashboard/quizzes">
            <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t(locale, "dashboard.backToDashboard")}
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
        </div>

        <Tabs defaultValue="quiz" className="w-full">
          <TabsList className="w-full grid grid-cols-2 max-w-xs">
            <TabsTrigger value="quiz">{t(locale, "dashboard.quizTab")}</TabsTrigger>
            <TabsTrigger value="stats">{t(locale, "dashboard.statsTab")}</TabsTrigger>
          </TabsList>

          <TabsContent value="quiz" className="mt-6 space-y-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{quizName}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {questions.length}{" "}
                {questions.length === 1
                  ? t(locale, "dashboard.question")
                  : t(locale, "dashboard.questions")}
              </p>
            </div>

            <div className="space-y-8">
              {questions.map((q, index) => (
                <section
                  key={q.id}
                  className="border-b border-border pb-8 last:border-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t(locale, "dashboard.questionLabel")} {index + 1}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {questionTypeLabel(q.type, locale)}
                    </span>
                  </div>
                  <p className="text-base font-medium text-foreground mb-4">
                    {q.label}
                  </p>
                  <ul className="space-y-2 mb-4">
                    {q.options.map((opt) => (
                      <li
                        key={opt.id}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        {opt.isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                        )}
                        <span className={opt.isCorrect ? "text-foreground font-medium" : ""}>
                          {opt.label}
                        </span>
                        {opt.isCorrect && (
                          <span className="text-xs text-green-600 dark:text-green-500">
                            ({locale === "fr" ? "Bonne réponse" : "Correct"})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {q.explanation?.trim() && (
                    <div className="rounded-lg bg-muted/50 dark:bg-muted/20 px-3 py-2 text-sm text-muted-foreground border-l-2 border-primary/30">
                      <span className="font-medium text-foreground">
                        {t(locale, "builder.explanationLabel")}:
                      </span>{" "}
                      {q.explanation.trim()}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <QuizStatsTab quizId={quizId} quizName={quizName} stats={stats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
