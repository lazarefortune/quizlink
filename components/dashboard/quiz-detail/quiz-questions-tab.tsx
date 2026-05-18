"use client";

import Image from "next/image";
import { CheckCheck, CheckCircle2, Circle, CircleCheck, CircleCheckBig, CopyCheck, MessageCircleQuestionMark } from "lucide-react";

import type { QuizContentQuestion } from "@/app/(app)/dashboard/quiz/[quizId]/actions";
import { Badge } from "@/components/ui/badge";
import { t, type Locale } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import { getQuestionImageSrc } from "@/lib/question-image-src";

type QuizQuestionsTabProps = {
  questions: QuizContentQuestion[];
};

function questionTypeLabel(type: string, locale: Locale): string {
  if (type === "MULTIPLE_CHOICE") {
    return t(locale, "builder.questionTypeMultipleChoice");
  }
  if (type === "CHECKBOX") {
    return t(locale, "builder.questionTypeCheckbox");
  }
  if (type === "TRUE_FALSE") {
    return t(locale, "builder.questionTypeTrueFalse");
  }
  return type;
}

function questionTypeIcon(type: string): React.ReactNode {
  if (type === "MULTIPLE_CHOICE") {
    return <CircleCheck className="h-4 w-4" />;
  }
  if (type === "CHECKBOX") {
    return <CopyCheck className="h-4 w-4" />;
  }
  if (type === "TRUE_FALSE") {
    return <CheckCheck className="h-4 w-4" />;
  }
  return <MessageCircleQuestionMark className="h-4 w-4" />;
}

export function QuizQuestionsTab({ questions }: QuizQuestionsTabProps) {
  const { locale } = useLocale();

  return (
    <section className="space-y-4">
      {questions.map((question, index) => (
        <article key={question.id} className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-base font-medium text-primary">
              {t(locale, "dashboard.questionLabel")} {index + 1}
            </span>
            <Badge variant="secondary" className="inline-flex items-center gap-1.5">
              {questionTypeIcon(question.type)}
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
                className="flex items-center gap-2 rounded-md border border-border/70 px-3 py-2"
              >
                {option.isCorrect ? (
                  <CircleCheckBig strokeWidth={2} className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Circle strokeWidth={2} className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                )}
                <span
                  className={
                    option.isCorrect ? "font-medium text-foreground" : "text-muted-foreground"
                  }
                >
                  {option.label}
                </span>
              </li>
            ))}
          </ul>

          {question.explanation?.trim() ? (
            <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {t(locale, "builder.explanationLabel")}:
              </span>{" "}
              {question.explanation.trim()}
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}
