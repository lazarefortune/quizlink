"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Clock, X } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  submitAnswerForAttempt,
  finishQuizAttempt,
  abandonQuizAttempt,
} from "@/app/quiz-link/play-actions";

type Question = {
  id: string;
  type: string;
  label: string;
  image: string | null;
  order: number;
  options: Array<{
    id: string;
    label: string;
    isCorrect: boolean;
  }>;
};

type Attempt = {
  id: string;
  quizLinkId: string;
  participantId: string;
  status: string;
  quizLink: {
    quiz: {
      id: string;
      name: string;
      settings: any;
      questions: Question[];
    };
  };
  participant: {
    id: string;
    name: string;
  };
};

type QuizPlayContentProps = {
  attempt: Attempt;
  token: string;
};

type AnswerState = {
  questionId: string;
  selectedOptionIds: string[];
  isVerified: boolean;
  isCorrect?: boolean;
  correctOptionIds?: string[];
  timeSpent?: number;
};

export function QuizPlayContent({ attempt, token }: QuizPlayContentProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  const settings = attempt.quizLink.quiz.settings as {
    showAnswerImmediately?: boolean;
    randomizeQuestions?: boolean;
    timeLimitPerQuestion?: number | null;
  };

  // Initialize questions and answers (only once when attempt changes)
  useEffect(() => {
    // Only initialize if we don't have questions yet or if attempt ID changed
    if (questions.length > 0 && questions[0]?.id === attempt.quizLink.quiz.questions[0]?.id) {
      return;
    }

    let quizQuestions = attempt.quizLink.quiz.questions;

    // Randomize questions if enabled
    if (settings.randomizeQuestions) {
      quizQuestions = [...quizQuestions].sort(() => Math.random() - 0.5);
    }

    // Randomize options for each question if randomizeQuestions is enabled
    if (settings.randomizeQuestions) {
      quizQuestions = quizQuestions.map((q) => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5),
      }));
    }

    setQuestions(quizQuestions);
    setAnswers(
      quizQuestions.map((q) => ({
        questionId: q.id,
        selectedOptionIds: [],
        isVerified: false,
      }))
    );
  }, [attempt.id]); // Only depend on attempt.id, not the whole attempt object

  // Timer effect
  useEffect(() => {
    if (!settings.timeLimitPerQuestion || questions.length === 0) {
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
    setQuestionStartTime(Date.now());

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
            handleFinish();
          }
        }, 500);
        setTimeRemaining(0);
      } else {
        setTimeRemaining(timerValue);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestionIndex, settings, questions, answers]);

  // Prevent window close/refresh when quiz is in progress
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only prevent if quiz is not finished
      if (!isQuizFinished) {
        e.preventDefault();
        // Modern browsers require returnValue to be set
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isQuizFinished]);

  // Note: We don't handle 'unload' event as it's unreliable in modern browsers
  // The beforeunload event will show a confirmation dialog, and if the user confirms,
  // they can use the quit button which will properly abandon the quiz via confirmQuit

  const submitAnswerForQuestion = useCallback(
    async (questionId: string, selectedOptionIds: string[]) => {
      setIsSubmitting(true);
      setError(null);

      // Validate that we have selected options
      if (!selectedOptionIds || selectedOptionIds.length === 0) {
        setError(t(locale, "quiz.noAnswer"));
        setIsSubmitting(false);
        return;
      }

      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

      try {
        const result = await submitAnswerForAttempt(
          attempt.id,
          questionId,
          selectedOptionIds,
          timeSpent
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
                timeSpent,
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
    },
    [attempt.id, questionStartTime, locale]
  );

  const handleAnswerSelect = (optionId: string) => {
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
  };

  const handleVerify = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);

    if (!currentAnswer || currentAnswer.selectedOptionIds.length === 0) {
      setError(t(locale, "quiz.noAnswer"));
      return;
    }

    await submitAnswerForQuestion(currentQuestion.id, currentAnswer.selectedOptionIds);
  };

  const handleNext = async () => {
    // Save current answer before moving to next question
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);

    if (currentAnswer && !currentAnswer.isVerified && currentAnswer.selectedOptionIds.length > 0) {
      // Save answer before moving to next question
      await submitAnswerForQuestion(currentQuestion.id, currentAnswer.selectedOptionIds);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleFinish = async () => {
    try {
      // Save current question answer if not already verified
      const currentQuestion = questions[currentQuestionIndex];
      const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);
      if (currentAnswer && !currentAnswer.isVerified && currentAnswer.selectedOptionIds.length > 0) {
        await submitAnswerForQuestion(currentQuestion.id, currentAnswer.selectedOptionIds);
      }

      // Save all unanswered questions
      const unansweredQuestions = questions.filter((q) => {
        const answer = answers.find((a) => a.questionId === q.id);
        return !answer?.isVerified && answer?.selectedOptionIds.length > 0;
      });

      for (const question of unansweredQuestions) {
        const answer = answers.find((a) => a.questionId === question.id);
        if (answer && answer.selectedOptionIds.length > 0) {
          await submitAnswerForQuestion(question.id, answer.selectedOptionIds);
        }
      }

      setIsQuizFinished(true); // Mark quiz as finished before redirecting

      const result = await finishQuizAttempt(attempt.id);

      if (!result.success) {
        setIsQuizFinished(false); // Reset if failed
        setError(result.error);
        return;
      }

      // Redirect to results
      router.push(`/quiz/${token}/results/${attempt.id}`);
    } catch (err) {
      setIsQuizFinished(false); // Reset if error
      setError(err instanceof Error ? err.message : "Failed to finish quiz");
    }
  };

  const handleQuit = () => {
    setShowQuitConfirm(true);
  };

  const confirmQuit = async () => {
    try {
      // Abandon the quiz attempt before marking as finished
      await abandonQuizAttempt(attempt.id);
    } catch (error) {
      console.error("Error abandoning quiz:", error);
      // Continue even if abandon fails
    } finally {
      // Mark as finished to allow navigation
      setIsQuizFinished(true);
      router.push("/");
    }
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t(locale, "quiz.loading")}</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);
  const showAnswerImmediately = settings?.showAnswerImmediately ?? false;
  const isVerified = currentAnswer?.isVerified ?? false;

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isAnswered = currentAnswer && currentAnswer.selectedOptionIds.length > 0;

  const getQuestionDescription = () => {
    if (currentQuestion.type === "MULTIPLE_CHOICE") {
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
        {error && <Alert variant="error">{error}</Alert>}

        <header className="space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h1 className="text-xl sm:text-2xl font-bold break-words flex-1">
              {attempt.quizLink.quiz.name}
            </h1>
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
            {currentQuestion.image && (
              <div className="mb-4">
                <img
                  src={currentQuestion.image}
                  alt="Question"
                  className="w-full max-h-64 object-contain rounded-md border"
                />
              </div>
            )}
            <CardTitle className="text-xl">{currentQuestion.label}</CardTitle>
            <CardDescription>{getQuestionDescription()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQuestion.options.map((option) => {
              const selected = isOptionSelected(option.id);
              const correct = isOptionCorrect(option.id);
              const incorrect = isOptionIncorrect(option.id);
              const optionLetter = String.fromCharCode(65 + currentQuestion.options.indexOf(option));

              // Determine styling based on state
              let borderColor = "";
              let letterBgColor = "";
              let letterTextColor = "";

              if (isVerified) {
                if (correct) {
                  // Green for correct answers - same color for border and badge
                  borderColor = "#22c55e"; // green-500
                  letterBgColor = "bg-green-500";
                  letterTextColor = "text-white";
                } else if (incorrect) {
                  // Red for incorrect answers - same color for border and badge
                  borderColor = "#ef4444"; // red-500
                  letterBgColor = "bg-red-500";
                  letterTextColor = "text-white";
                } else {
                  // Gray for unselected options
                  borderColor = "";
                  letterBgColor = "bg-muted";
                  letterTextColor = "text-muted-foreground";
                }
              } else {
                if (selected) {
                  // Primary color for selected options
                  borderColor = "hsl(var(--primary))";
                  letterBgColor = "bg-primary";
                  letterTextColor = "text-primary-foreground";
                } else {
                  // Gray for unselected options
                  borderColor = "";
                  letterBgColor = "bg-muted";
                  letterTextColor = "text-muted-foreground";
                }
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswerSelect(option.id)}
                  disabled={isVerified}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                    !borderColor && "border-border",
                    isVerified ? "cursor-not-allowed" : "cursor-pointer hover:shadow-sm"
                  )}
                  style={borderColor ? { borderColor } : undefined}
                >
                  <div className="flex items-center gap-4">
                    {/* Letter badge */}
                    <div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-md font-semibold text-sm shrink-0 transition-colors",
                        letterBgColor,
                        letterTextColor
                      )}
                    >
                      {optionLetter}
                    </div>
                    {/* Option text */}
                    <div className="flex-1">
                      <span className="text-sm sm:text-base">{option.label}</span>
                    </div>
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
                {isSubmitting
                  ? t(locale, "common.loading")
                  : t(locale, "quiz.verify")}
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
              <Button
                variant="ghost"
                onClick={() => setShowQuitConfirm(false)}
              >
                {t(locale, "common.cancel")}
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
