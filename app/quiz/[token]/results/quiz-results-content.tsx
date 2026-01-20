"use client";

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
import { Alert } from "@/components/ui/alert";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

type Attempt = {
  id: string;
  score: number | null;
  quizLink: {
    token: string;
    allowMultipleAttempts: boolean;
    quiz: {
      id: string;
      name: string;
      questions: Array<{
        id: string;
        label: string;
        type: string;
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
  } | null;
  answers: Array<{
    id: string;
    questionId: string;
    selectedOptionIds: any;
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

  const totalQuestions = attempt.quizLink.quiz.questions.length;
  const correctAnswers = attempt.answers.filter((a) => a.isCorrect).length;
  const score = attempt.score ?? (totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0);

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

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
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
                {score.toFixed(1)}%
              </div>
              <div className="text-muted-foreground">
                {correctAnswers} / {totalQuestions} {t(locale, "quiz.correctAnswers")}
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {t(locale, "quiz.detailedResults")}
              </h3>
              {attempt.quizLink.quiz.questions.map((question, index) => {
                const answer = getAnswerForQuestion(question.id);
                const isCorrect = answer?.isCorrect ?? false;
                const selectedOptions = answer ? getSelectedOptions(answer) : [];
                const correctOptions = getCorrectOptions(question);

                return (
                  <Card key={question.id} className={isCorrect ? "border-green-500" : "border-red-500"}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">
                          {t(locale, "quiz.question")} {index + 1}: {question.label}
                        </CardTitle>
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">
                          {t(locale, "quiz.yourAnswer")}:
                        </p>
                        {selectedOptions.length > 0 ? (
                          <div className="space-y-1">
                            {selectedOptions.map((opt) => (
                              <Badge
                                key={opt.id}
                                variant={opt.isCorrect ? "default" : "outline"}
                                className="mr-2"
                              >
                                {opt.label}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {t(locale, "quiz.noAnswer")}
                          </p>
                        )}
                      </div>
                      {!isCorrect && (
                        <div>
                          <p className="text-sm font-medium mb-2">
                            {t(locale, "quiz.correctAnswer")}:
                          </p>
                          <div className="space-y-1">
                            {correctOptions.map((opt) => (
                              <Badge key={opt.id} variant="default" className="mr-2">
                                {opt.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {answer?.timeSpent && (
                        <p className="text-xs text-muted-foreground">
                          {t(locale, "quiz.timeSpent")}: {answer.timeSpent}s
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Restart Button */}
            {attempt.quizLink.allowMultipleAttempts && (
              <div className="border-t pt-6">
                <Button
                  onClick={handleRestartQuiz}
                  className="w-full"
                  size="lg"
                  variant="primary"
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
