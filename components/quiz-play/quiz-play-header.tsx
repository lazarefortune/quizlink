"use client";

import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";

type QuizPlayHeaderProps = {
  quizName: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  onQuit: () => void;
  quitDisabled?: boolean;
};

export function QuizPlayHeader({
  quizName,
  currentQuestionIndex,
  totalQuestions,
  onQuit,
  quitDisabled = false,
}: QuizPlayHeaderProps) {
  const { locale } = useLocale();
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <header className="space-y-2">
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <h1 className="h1 flex-1 break-words text-xl font-semibold sm:text-2xl">
          {quizName}
        </h1>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onQuit}
            disabled={quitDisabled}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="mr-1 h-4 w-4" />
            {t(locale, "quiz.quit")}
          </Button>
          <Badge variant="outline">
            {currentQuestionIndex + 1} / {totalQuestions}
          </Badge>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-blue transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </header>
  );
}
