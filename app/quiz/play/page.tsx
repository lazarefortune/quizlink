"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock, X } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { startQuizAction, submitAnswerAction, getResultsAction } from "@/app/quiz/actions";
import type { PublicQuestion } from "@/lib/quiz-session/quiz-session-types";
import type { Quiz } from "@/types/quiz";
import { getQuestionImageSrc } from "@/lib/question-image-src";

type AnswerState = {
  questionId: string;
  selectedOptionIds: string[];
  isVerified: boolean;
  isCorrect?: boolean;
  correctOptionIds?: string[];
};

function QuizPlayPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState<string>("");
  const [settings, setSettings] = useState<{
    showAnswerImmediately: boolean;
    randomizeQuestions: boolean;
    timeLimitPerQuestion: number | null;
  } | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitAnswerForQuestion = useCallback(async (questionId: string, selectedOptionIds: string[]) => {
    if (!quizSessionId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitAnswerAction(
        quizSessionId,
        questionId,
        selectedOptionIds
      );

      if (!result.success) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      setAnswers((prev) =>
        prev.map((a) => {
          if (a.questionId === questionId) {
            return {
              ...a,
              isVerified: true,
              isCorrect: result.isCorrect,
              correctOptionIds: result.correctOptionIds,
            };
          }
          return a;
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  }, [quizSessionId]);

  const finishQuiz = useCallback(async () => {
    if (!quizSessionId) return;

    try {
      const result = await getResultsAction(quizSessionId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      const results = {
        quizId: quizSessionId,
        totalQuestions: result.totalQuestions,
        correctAnswers: result.correctAnswersCount,
        detailedResults: result.detailedResults,
      };

      sessionStorage.setItem("quizResults", JSON.stringify(results));
      router.push("/quiz/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get results");
    }
  }, [quizSessionId, router]);

  // Initialize quiz session
  useEffect(() => {
    async function initializeQuiz() {
      const quizId = searchParams.get("quizId");

      // If quizId is in URL, load from database
      if (quizId) {
        try {
          // Create a minimal Quiz object with just the ID
          // startQuizAction will load from database if ID doesn't start with "temp-"
          const quiz: Partial<Quiz> & { id: string } = {
            id: quizId,
            title: "",
            settings: {
              showAnswerImmediately: false,
              randomizeQuestions: false,
              randomizeOptions: false,
              timeLimitPerQuestion: null,
            },
            questions: [],
            createdAt: new Date(),
          };

          const result = await startQuizAction(quiz);

          if (!result.success) {
            setError(result.error || "Failed to load quiz");
            setIsLoading(false);
            return;
          }

          setQuizSessionId(result.quizSessionId);
          setQuizTitle(result.title);
          setSettings(result.settings);
          setQuestions(result.questions);
          setAnswers(
            result.questions.map((q) => ({
              questionId: q.id,
              selectedOptionIds: [],
              isVerified: false,
            }))
          );
          setIsLoading(false);
          return;
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load quiz");
          setIsLoading(false);
          return;
        }
      }

      // Otherwise, try to load from sessionStorage (for preview flow)
      const quizData = sessionStorage.getItem("currentQuiz");
      if (!quizData) {
        router.push("/generate");
        return;
      }

      try {
        const parsedQuiz: Quiz = JSON.parse(quizData);
        parsedQuiz.createdAt = new Date(parsedQuiz.createdAt);

        const result = await startQuizAction(parsedQuiz);

        if (!result.success) {
          setError(result.error);
          return;
        }

        setQuizSessionId(result.quizSessionId);
        setQuizTitle(result.title);
        setSettings(result.settings);
        setQuestions(result.questions);
        setAnswers(
          result.questions.map((q) => ({
            questionId: q.id,
            selectedOptionIds: [],
            isVerified: false,
          }))
        );
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start quiz");
      }
    }

    initializeQuiz();
  }, [router, searchParams]);

  // Timer effect
  useEffect(() => {
    if (!settings?.timeLimitPerQuestion || !quizSessionId) {
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);

    // Reset timer when question changes or when verified
    if (currentAnswer?.isVerified) {
      setTimeRemaining(null);
      setIsTimeUp(false);
      return;
    }

    let timerValue = settings.timeLimitPerQuestion;
    setTimeRemaining(timerValue);
    setIsTimeUp(false);

    const interval = setInterval(() => {
      timerValue -= 1;
      if (timerValue <= 0) {
        setIsTimeUp(true);
        clearInterval(interval);
        // Auto-advance to next question or finish quiz
        setTimeout(() => {
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
          } else {
            finishQuiz();
          }
        }, 500);
        setTimeRemaining(0);
      } else {
        setTimeRemaining(timerValue);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestionIndex, settings, quizSessionId, questions, answers, finishQuiz]);

  const handleAnswerSelect = async (optionId: string) => {
    if (!quizSessionId) return;

    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);

    // Don't allow modification once answer is verified
    if (currentAnswer?.isVerified) return;

    const updatedAnswers = answers.map((a) => {
      if (a.questionId !== currentQuestion.id) return a;

      if (currentQuestion.type === "CHECKBOX") {
        const isSelected = a.selectedOptionIds.includes(optionId);
        return {
          ...a,
          selectedOptionIds: isSelected
            ? a.selectedOptionIds.filter((id) => id !== optionId)
            : [...a.selectedOptionIds, optionId],
        };
      } else {
        return {
          ...a,
          selectedOptionIds: [optionId],
        };
      }
    });

    setAnswers(updatedAnswers);
    // No auto-submit - user must click "Verify" button
  };

  const handleVerify = async () => {
    if (!quizSessionId) return;

    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);

    if (!currentAnswer || currentAnswer.selectedOptionIds.length === 0) return;

    await submitAnswerForQuestion(currentQuestion.id, currentAnswer.selectedOptionIds);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuit = () => {
    setShowQuitConfirm(true);
  };

  const confirmQuit = () => {
    sessionStorage.removeItem("currentQuiz");
    router.push("/generate");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-muted-foreground">{t(locale, "quiz.loading")}</p>
        </div>
      </div>
    );
  }

  if (error && !questions.length) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-2xl">
          <Alert variant="error">{error}</Alert>
          <Button onClick={() => router.push("/generate")} className="mt-4">
            {t(locale, "quiz.quit")}
          </Button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentQuestionImageSrc = getQuestionImageSrc({
    image: currentQuestion.image,
    imageKey: currentQuestion.imageKey,
  });
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);
  const showAnswerImmediately = settings?.showAnswerImmediately ?? false;
  const isVerified = currentAnswer?.isVerified ?? false;

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isAnswered = currentAnswer && currentAnswer.selectedOptionIds.length > 0;

  const getQuestionDescription = () => {
    if (currentQuestion.type === "MCQ") {
      return t(locale, "quiz.selectCorrectAnswer");
    } else if (currentQuestion.type === "CHECKBOX") {
      return t(locale, "quiz.selectAllCorrectAnswers");
    } else {
      return t(locale, "quiz.selectTrueOrFalse");
    }
  };

  const isOptionCorrect = (optionId: string) => {
    if (!isVerified) return false;
    return currentAnswer?.correctOptionIds?.includes(optionId) ?? false;
  };

  const isOptionSelected = (optionId: string) => {
    return currentAnswer?.selectedOptionIds.includes(optionId) ?? false;
  };

  const isOptionIncorrect = (optionId: string) => {
    if (!isVerified) return false;
    return isOptionSelected(optionId) && !isOptionCorrect(optionId);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {error && (
          <Alert variant="error">{error}</Alert>
        )}

        <header className="space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h1 className="text-xl sm:text-2xl font-bold break-words flex-1">{quizTitle}</h1>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleQuit}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                {t(locale, "quiz.quit")}
              </Button>
              {timeRemaining !== null && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeRemaining} {t(locale, "quiz.seconds")}
                </Badge>
              )}
              <Badge variant="outline">
                {currentQuestionIndex + 1} / {questions.length}
              </Badge>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        {isTimeUp && (
          <Alert variant="error">
            {t(locale, "quiz.timeRemaining")}: 0 {t(locale, "quiz.seconds")}
          </Alert>
        )}

        <Card>
          <CardHeader>
            {currentQuestionImageSrc ? (
              <div className="mb-4 relative w-full h-64">
                <Image
                  src={currentQuestionImageSrc}
                  alt="Question"
                  fill
                  className="object-contain rounded-md border"
                  unoptimized
                />
              </div>
            ) : null}
            <CardTitle className="text-xl">
              {currentQuestion.label}
            </CardTitle>
            <CardDescription>
              {getQuestionDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQuestion.options.map((option) => {
              const selected = isOptionSelected(option.id);
              const correct = isOptionCorrect(option.id);
              const incorrect = isOptionIncorrect(option.id);

              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswerSelect(option.id)}
                  disabled={isVerified}
                  className={`w-full text-left p-4 rounded-md border-2 transition-colors cursor-pointer ${
                    correct && isVerified
                      ? "border-green-500 bg-green-50 dark:bg-green-950/50"
                      : incorrect
                        ? "border-red-500 bg-red-50 dark:bg-red-950/50"
                        : selected
                          ? "border-primary bg-primary/10"
                          : "border-input hover:border-primary/50"
                  } ${isVerified ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium mr-2">
                        {String.fromCharCode(65 + currentQuestion.options.indexOf(option))}.
                      </span>
                      {option.label}
                    </div>
                    {isVerified && (
                      <>
                        {correct && (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        )}
                        {incorrect && (
                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              {t(locale, "quiz.previous")}
            </Button>
            {showAnswerImmediately && !isVerified ? (
              <Button
                variant="primary"
                onClick={handleVerify}
                disabled={!isAnswered || isSubmitting}
                className="ml-auto"
              >
                {isSubmitting ? t(locale, "common.loading") : t(locale, "quiz.verify")}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!isAnswered}
                className="ml-auto"
              >
                {currentQuestionIndex === questions.length - 1
                  ? t(locale, "quiz.finish")
                  : t(locale, "quiz.continue")}
              </Button>
            )}
          </CardFooter>
        </Card>

        <Dialog open={showQuitConfirm} onOpenChange={setShowQuitConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t(locale, "quiz.quit")}</DialogTitle>
              <DialogDescription>
                {t(locale, "quiz.quitConfirm")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowQuitConfirm(false)}>
                {t(locale, "options.cancel")}
              </Button>
              <Button variant="destructive" onClick={confirmQuit}>
                {t(locale, "quiz.quit")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function QuizPlayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <QuizPlayPageContent />
    </Suspense>
  );
}
