"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RotateCcw, ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { QuizRichText } from "@/components/quiz/quiz-rich-text";
import { mergeQuizSettingsFromStored } from "@/lib/quiz/mergeQuizSettingsFromStored";
import { getQuestionImageSrc } from "@/lib/question-image-src";
import { richTextToPlainText } from "@/lib/rich-text/richTextToPlainText";

export type Attempt = {
  id: string;
  score: number | null;
  quizLink: {
    token: string;
    allowMultipleAttempts: boolean;
    quiz: {
      id: string;
      name: string;
      settings: unknown;
      questions: Array<{
        id: string;
        label: string;
        type: string;
        image: string | null;
        imageKey: string | null;
        explanation: string | null;
        options: Array<{
          id: string;
          label: string;
          isCorrect: boolean;
        }>;
      }>;
    };
  };
  participant: {
    name: string;
    publicToken: string | null;
  } | null;
  answers: Array<{
    id: string;
    questionId: string;
    selectedOptionIds: string[];
    isCorrect: boolean;
    timeSpent: number | null;
    question: {
      id: string;
      label: string;
      type: string;
      options: Array<{
        id: string;
        label: string;
        isCorrect: boolean;
      }>;
    };
  }>;
};

type QuizResultsContentProps = {
  attempt: Attempt;
};

export function QuizResultsContent({ attempt }: QuizResultsContentProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const token = attempt.quizLink.token;

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const totalQuestions = attempt.quizLink.quiz.questions.length;
  const correctAnswers = attempt.answers.filter((a) => a.isCorrect).length;
  const score = attempt.score ?? (totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0);
  const effectiveSettings = mergeQuizSettingsFromStored(attempt.quizLink.quiz.settings);
  const shouldRevealAnswers = effectiveSettings.showAnswerImmediately;
  const shouldShowAnswerDetails = effectiveSettings.showAnswersAtEnd ?? true;

  const getAnswerForQuestion = (questionId: string) => {
    return attempt.answers.find((a) => a.questionId === questionId);
  };

  const getSelectedOptions = (answer: typeof attempt.answers[0]) => {
    if (!answer) return [];
    const selectedIds = Array.isArray(answer.selectedOptionIds)
      ? answer.selectedOptionIds
      : [];
    return answer.question.options.filter((opt) =>
      selectedIds.includes(opt.id)
    );
  };

  const getCorrectOptions = (question: typeof attempt.quizLink.quiz.questions[0]) => {
    return question.options.filter((opt) => opt.isCorrect);
  };

  const handleRestartQuiz = () => {
    router.push(`/quiz/${token}`);
  };

  const portalToken = attempt.participant?.publicToken ?? null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {portalToken && (
          <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground hover:text-foreground">
            <Link href={`/p/${portalToken}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t(locale, "quiz.backToPortal")}
            </Link>
          </Button>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">
              {attempt.quizLink.quiz.name}
            </CardTitle>
            <CardDescription>
              {t(locale, "quiz.resultsFor")} {attempt.participant ? attempt.participant.name : "Anonyme"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Summary */}
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold">
                {correctAnswers} / {totalQuestions}
              </div>
              <div className="text-muted-foreground">
                {score.toFixed(0)}% {t(locale, "quiz.correctAnswers")}
              </div>
              {!shouldShowAnswerDetails && (
                <p className="text-sm text-muted-foreground">
                  {t(locale, "quiz.answerDetailsHidden")}
                </p>
              )}
            </div>

            {/* Detailed Results */}
            {shouldShowAnswerDetails && (
            <div className="space-y-4">
              <h3 className="text-xl font-medium">
                {t(locale, "quiz.detailedResults")}
              </h3>
              {attempt.quizLink.quiz.questions.map((question, index) => {
                const answer = getAnswerForQuestion(question.id);
                const isCorrect = answer?.isCorrect ?? false;
                const selectedOptions = answer ? getSelectedOptions(answer) : [];
                const correctOptions = getCorrectOptions(question);

                const questionImageSrc = getQuestionImageSrc({
                  image: question.image,
                  imageKey: question.imageKey,
                });

                return (
                  <Card key={question.id} className={isCorrect ? "border-green-500" : "border-red-500"}>
                    <CardHeader className="space-y-3">
                      {questionImageSrc ? (
                        <div className="relative h-48 w-full overflow-hidden rounded-md border sm:h-64">
                          <Image
                            src={questionImageSrc}
                            alt={richTextToPlainText(question.label)}
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      ) : null}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            {t(locale, "quiz.question")} {index + 1}
                          </p>
                          <QuizRichText
                            html={question.label}
                            className="text-lg font-semibold leading-snug sm:text-xl"
                          />
                        </div>
                        {isCorrect ? (
                          <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="h-6 w-6 shrink-0 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-base font-medium mb-2">
                          {t(locale, "quiz.yourAnswer")}:
                        </p>
                        {selectedOptions.length > 0 ? (
                          <div className="space-y-1">
                            {selectedOptions.map((opt) => {
                              const badgeClass = shouldRevealAnswers
                                ? opt.isCorrect
                                  ? "mr-2 text-white bg-green-600"
                                  : "mr-2 text-white bg-red-500 dark:bg-red-700"
                                : "mr-2";
                              return (
                                <Badge
                                  key={opt.id}
                                  variant={
                                    shouldRevealAnswers && opt.isCorrect
                                      ? "default"
                                      : "outline"
                                  }
                                  className={badgeClass}
                                >
                                  {opt.label}
                                </Badge>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-base text-muted-foreground">
                            {t(locale, "quiz.noAnswer")}
                          </p>
                        )}
                      </div>
                      {shouldRevealAnswers && !isCorrect && (
                        <div>
                          <p className="text-base font-medium mb-2">
                            {t(locale, "quiz.correctAnswer")}:
                          </p>
                          <div className="space-y-1">
                            {correctOptions.map((opt) => (
                              <Badge key={opt.id} variant="default" className={opt.isCorrect ? "mr-2 bg-green-600" : "mr-2 bg-red-500 dark:bg-red-700"}>
                                {opt.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {answer?.timeSpent !== null && answer?.timeSpent !== undefined ? (
                        <p className="text-base text-muted-foreground">
                          {t(locale, "quiz.timeSpent")}: {formatDuration(answer.timeSpent)}
                        </p>
                      ) : null}
                      {shouldRevealAnswers && !isCorrect && question.explanation?.trim() ? (
                        <div className="mt-3 rounded-lg border border-border bg-muted/50 p-3">
                          <p className="text-sm font-medium text-foreground mb-1">
                            {t(locale, "quiz.explanation")}
                          </p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {question.explanation.trim()}
                          </p>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            )}

            {/* Restart Button */}
            {attempt.quizLink.allowMultipleAttempts && (
              <div className="border-t border-border pt-6">
                <Button
                  onClick={handleRestartQuiz}
                  className="w-full"
                  size="lg"
                  variant="blue"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t(locale, "quiz.restart")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
