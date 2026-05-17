"use client";

import Image from "next/image";

import type { QuizContentQuestion } from "@/app/(app)/dashboard/quiz/[quizId]/actions";
import type { QuestionInsight } from "@/lib/dashboard/aggregate-question-insights";
import { Badge } from "@/components/ui/badge";
import { t, type Locale } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import { getQuestionImageSrc } from "@/lib/question-image-src";
import { formatDurationShort } from "@/lib/dashboard/quiz-detail-stats";
import { cn } from "@/lib/utils";

type QuizQuestionAnalysisSectionProps = {
  questions: QuizContentQuestion[];
  insights: QuestionInsight[];
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

export function QuizQuestionAnalysisSection({
  questions,
  insights,
}: QuizQuestionAnalysisSectionProps) {
  const { locale } = useLocale();
  const insightsById = new Map(insights.map((insight) => [insight.questionId, insight]));

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{t(locale, "dashboard.questionAnalysisTitle")}</h2>
      <div className="space-y-4">
        {questions.map((question, index) => {
          const insight = insightsById.get(question.id);
          const imageSrc = getQuestionImageSrc(question);
          const correctOptions = question.options.filter((option) => option.isCorrect);
          const maxOptionCount = Math.max(
            ...(insight?.optionDistribution.map((option) => option.count) ?? [0]),
            1,
          );

          return (
            <article
              key={question.id}
              className="rounded-xl border border-border bg-card p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="tabular-nums">
                  {t(locale, "dashboard.questionLabel")} {index + 1}
                </Badge>
                <Badge variant="secondary">{questionTypeLabel(question.type, locale)}</Badge>
                {insight && insight.responseCount > 0 ? (
                  <>
                    <Badge variant="outline" className="tabular-nums">
                      {t(locale, "dashboard.questionSuccessRate", {
                        rate: insight.successRate?.toFixed(0) ?? "0",
                      })}
                    </Badge>
                    <Badge variant="outline" className="tabular-nums">
                      {insight.responseCount}{" "}
                      {insight.responseCount <= 1
                        ? t(locale, "dashboard.responseSingular")
                        : t(locale, "dashboard.responsesPlural")}
                    </Badge>
                    {insight.averageTimeSeconds != null ? (
                      <Badge variant="outline">
                        {t(locale, "dashboard.questionAverageTime", {
                          time: formatDurationShort(insight.averageTimeSeconds),
                        })}
                      </Badge>
                    ) : null}
                  </>
                ) : null}
              </div>

              <p className="mt-3 text-base font-semibold text-foreground">{question.label}</p>

              {imageSrc ? (
                <div className="relative mt-3 aspect-video max-h-48 w-full max-w-md overflow-hidden rounded-lg border border-border bg-muted">
                  <Image
                    src={imageSrc}
                    alt=""
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
              ) : null}

              {insight && insight.responseCount > 0 ? (
                <div className="mt-4 space-y-2">
                  {insight.optionDistribution.map((option) => (
                    <div key={option.optionId} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span
                          className={cn(
                            option.isCorrect ? "font-medium text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {option.label}
                          {option.isCorrect ? (
                            <span className="ml-1 text-xs text-green-600 dark:text-green-400">
                              ({t(locale, "dashboard.correctLabel")})
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {option.count} · {option.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            option.isCorrect ? "bg-green-600" : "bg-primary/60",
                          )}
                          style={{
                            width: `${(option.count / maxOptionCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t(locale, "dashboard.questionNoResponsesYet")}
                </p>
              )}

              {correctOptions.length > 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {t(locale, "dashboard.correctAnswerLabel")}:{" "}
                  </span>
                  {correctOptions.map((option) => option.label).join(", ")}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

