"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { X } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { QuizQuestionImage } from "@/components/quiz/quiz-question-image";
import { getQuestionImageSrc } from "@/lib/question-image-src";
import { usePrefetchQuestionImages } from "@/lib/quiz/usePrefetchQuestionImages";
import { resolveQuizActionError } from "@/lib/quiz/resolveQuizActionError";
import { resolveEffectiveShuffleSettings } from "@/lib/quiz/shuffleSettings";
import {
  isQuizAnswerLocked,
  shouldShowQuizAnswerCorrection,
} from "@/lib/quiz/quizAnswerLock";
import {
  findNextUnlockedQuestionId,
  findQuestionIndexById,
} from "@/lib/quiz/quizActiveTimedQuestion";
import { useQuizQuestionTimer } from "@/lib/quiz/useQuizQuestionTimer";
import { QuizRichText } from "@/components/quiz/quiz-rich-text";
import { QuizQuestionTypeBadge } from "@/components/quiz/quiz-question-type-badge";
import { QuizQuestionFloatingTimer } from "@/components/quiz/quiz-question-floating-timer";
import { cn } from "@/lib/utils";
import {
  submitAnswerForAttempt,
  finishQuizAttempt,
  abandonQuizAttempt,
} from "@/app/quiz-link/play-actions";
import { track } from "@/lib/analytics/track";
import { ATTEMPT_COMPLETED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";

type Question = {
  id: string;
  type: string;
  label: string;
  image: string | null;
  imageKey: string | null;
  order: number;
  explanation: string | null;
  options: Array<{
    id: string;
    label: string;
    isCorrect: boolean;
  }>;
};

export type Attempt = {
  id: string;
  quizLinkId: string;
  participantId: string | null;
  status: string;
  quizLink: {
    quiz: {
      id: string;
      name: string;
      settings: { showAnswerImmediately?: boolean; randomizeQuestions?: boolean; randomizeOptions?: boolean; timeLimitPerQuestion?: number | null };
      questions: Question[];
    };
  };
  participant: {
    id: string;
    name: string;
  } | null;
};

type QuizPlayContentProps = {
  attempt: Attempt;
  token: string;
};

type AnswerState = {
  questionId: string;
  selectedOptionIds: string[];
  isVerified: boolean;
  isLocked: boolean;
  isExpired: boolean;
  isCorrect?: boolean;
  correctOptionIds?: string[];
  timeSpent?: number;
};

export function QuizPlayContent({ attempt, token }: QuizPlayContentProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeTimedQuestionId, setActiveTimedQuestionId] = useState<string | null>(
    null,
  );
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const answersRef = useRef<AnswerState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const handleFinishRef = useRef<() => Promise<void>>(async () => {});

  const settings = attempt.quizLink.quiz.settings as {
    showAnswerImmediately?: boolean;
    randomizeQuestions?: boolean;
    randomizeOptions?: boolean;
    timeLimitPerQuestion?: number | null;
  };

  const timeLimit = settings.timeLimitPerQuestion ?? 0;

  // Initialize questions and answers (only once when attempt changes)
  useEffect(() => {
    // Only initialize if we don't have questions yet or if attempt ID changed
    if (questions.length > 0 && questions[0]?.id === attempt.quizLink.quiz.questions[0]?.id) {
      return;
    }

    const shuffle = resolveEffectiveShuffleSettings({
      randomizeQuestions: Boolean(settings.randomizeQuestions),
      randomizeOptions:
        typeof settings.randomizeOptions === "boolean"
          ? settings.randomizeOptions
          : undefined,
    });

    let quizQuestions = attempt.quizLink.quiz.questions;

    if (shuffle.randomizeQuestions) {
      quizQuestions = [...quizQuestions].sort(() => Math.random() - 0.5);
    }

    if (shuffle.randomizeOptions) {
      quizQuestions = quizQuestions.map((q) => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5),
      }));
    }

    setQuestions(quizQuestions);
    const initialAnswers = quizQuestions.map<AnswerState>((q) => ({
      questionId: q.id,
      selectedOptionIds: [],
      isVerified: false,
      isLocked: false,
      isExpired: false,
    }));
    answersRef.current = initialAnswers;
    setAnswers(initialAnswers);
    setActiveTimedQuestionId(
      timeLimit > 0 && quizQuestions[0] ? quizQuestions[0].id : null,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: init answers from attempt once per attempt.id
  }, [attempt.id]);

  // Reset question start time only when the question index changes
  useEffect(() => {
    if (questions.length === 0) return;
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex, questions.length]);

  const activeTimedAnswer = activeTimedQuestionId
    ? answers.find((answer) => answer.questionId === activeTimedQuestionId)
    : undefined;
  const isActiveTimedQuestionLocked = isQuizAnswerLocked(activeTimedAnswer);

  const buildAnswersByQuestionId = useCallback(
    (source: AnswerState[]) =>
      Object.fromEntries(source.map((answer) => [answer.questionId, answer])),
    [],
  );

  const lockQuestionOnTimerExpire = useCallback((questionId: string) => {
    setAnswers((prev) => {
      const next = prev.map((a) =>
        a.questionId === questionId
          ? { ...a, isExpired: true, isLocked: true }
          : a,
      );
      answersRef.current = next;
      return next;
    });
  }, []);

  const handleTimerExpire = useCallback(
    (questionId: string) => {
      lockQuestionOnTimerExpire(questionId);

      const answersByQuestionId = buildAnswersByQuestionId(answersRef.current);
      const nextActiveTimedQuestionId = findNextUnlockedQuestionId(
        questions,
        answersByQuestionId,
        questionId,
      );

      setTimeout(() => {
        if (nextActiveTimedQuestionId) {
          const nextIndex = findQuestionIndexById(
            questions,
            nextActiveTimedQuestionId,
          );
          if (nextIndex !== null) {
            setActiveTimedQuestionId(nextActiveTimedQuestionId);
            setCurrentQuestionIndex(nextIndex);
            return;
          }
        }

        setActiveTimedQuestionId(null);
        void handleFinishRef.current();
      }, 500);
    },
    [questions, lockQuestionOnTimerExpire, buildAnswersByQuestionId],
  );

  const { timeRemaining: activeTimedTimeRemaining, isTimeUp } = useQuizQuestionTimer({
    totalSeconds: timeLimit,
    activeTimedQuestionId: activeTimedQuestionId ?? undefined,
    isActiveTimedQuestionLocked,
    onBackgroundExpire: lockQuestionOnTimerExpire,
    onExpire: handleTimerExpire,
  });

  const handleBackToActiveTimedQuestion = useCallback(() => {
    if (!activeTimedQuestionId) {
      return;
    }

    const targetIndex = findQuestionIndexById(questions, activeTimedQuestionId);
    if (targetIndex === null) {
      return;
    }

    setCurrentQuestionIndex(targetIndex);
  }, [activeTimedQuestionId, questions]);

  usePrefetchQuestionImages(questions, currentQuestionIndex, { lookahead: 2 });

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

      if (!selectedOptionIds || selectedOptionIds.length === 0) {
        setError(t(locale, "quiz.noAnswer"));
        setIsSubmitting(false);
        return;
      }

      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      const maxRetries = 3;

      for (let attemptCount = 0; attemptCount < maxRetries; attemptCount++) {
        try {
          const result = await submitAnswerForAttempt(
            attempt.id,
            questionId,
            selectedOptionIds,
            timeSpent
          );

          if (!result.success) {
            setError(resolveQuizActionError(locale, result.error));
            setIsSubmitting(false);
            return;
          }

          setAnswers((prev) => {
            const next = prev.map((a) => {
              if (a.questionId === questionId) {
                return {
                  ...a,
                  isVerified: true,
                  isLocked: true,
                  isCorrect: result.isCorrect,
                  correctOptionIds: result.correctOptionIds,
                  timeSpent,
                };
              }
              return a;
            });
            answersRef.current = next;
            return next;
          });
          setIsSubmitting(false);
          return;
        } catch (err) {
          if (attemptCount < maxRetries - 1) {
            await new Promise((r) => setTimeout(r, 500));
            continue;
          }
          setError(err instanceof Error ? err.message : "Failed to submit answer");
        }
      }
      setIsSubmitting(false);
    },
    [attempt.id, questionStartTime, locale]
  );

  const handleAnswerSelect = (optionId: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);

    if (isQuizAnswerLocked(currentAnswer)) return;

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
      const nextIndex = currentQuestionIndex + 1;
      const answersByQuestionId = buildAnswersByQuestionId(answersRef.current);
      const nextActiveTimedQuestionId = findNextUnlockedQuestionId(
        questions,
        answersByQuestionId,
        currentQuestion.id,
      );

      setCurrentQuestionIndex(nextIndex);
      if (timeLimit > 0) {
        setActiveTimedQuestionId(nextActiveTimedQuestionId);
      }
    } else {
      if (timeLimit > 0) {
        setActiveTimedQuestionId(null);
      }
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleFinish = useCallback(async () => {
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
        return !answer?.isVerified && (answer?.selectedOptionIds?.length ?? 0) > 0;
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
        setIsQuizFinished(false);
        setError(resolveQuizActionError(locale, result.error));
        return;
      }

      track(ATTEMPT_COMPLETED, {
        ...buildCommonEventProps({ preferredLanguage: locale }),
        quiz_id: attempt.quizLink.quiz.id,
        participant_id: attempt.participantId ?? undefined,
        score_pct: result.score ?? 0,
        question_count: result.totalQuestions ?? 0,
        duration_sec: result.durationSec,
      });

      // Redirect to results
      router.push(`/quiz/${token}/results/${attempt.id}`);
    } catch (err) {
      setIsQuizFinished(false); // Reset if error
      setError(err instanceof Error ? err.message : "Failed to finish quiz");
    }
  }, [
    answers,
    attempt.id,
    attempt.participantId,
    attempt.quizLink.quiz.id,
    currentQuestionIndex,
    locale,
    questions,
    router,
    submitAnswerForQuestion,
    token,
  ]);

  handleFinishRef.current = handleFinish;

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
  const currentQuestionImageSrc = getQuestionImageSrc({
    image: currentQuestion.image,
    imageKey: currentQuestion.imageKey,
  });
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);
  const showAnswerImmediately = settings?.showAnswerImmediately ?? false;
  const isVerified = currentAnswer?.isVerified ?? false;
  const isLocked = isQuizAnswerLocked(currentAnswer);
  const showCorrection = shouldShowQuizAnswerCorrection({
    isVerified,
    showAnswerImmediately,
  });

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isAnswered = currentAnswer && currentAnswer.selectedOptionIds.length > 0;

  const isOptionCorrect = (optionId: string) => {
    if (!showCorrection) return false;
    return currentAnswer?.correctOptionIds?.includes(optionId) ?? false;
  };

  const isOptionSelected = (optionId: string) => {
    return currentAnswer?.selectedOptionIds.includes(optionId) ?? false;
  };

  const isOptionIncorrect = (optionId: string) => {
    if (!showCorrection) return false;
    return isOptionSelected(optionId) && !isOptionCorrect(optionId);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-28 sm:p-8">
      <div className="mx-auto w-full max-w-none space-y-6 md:max-w-3xl">
        {error && <Alert variant="error">{error}</Alert>}

        <header className="space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h1 className="h1 text-xl sm:text-2xl font-semibold break-words flex-1">
              {attempt.quizLink.quiz.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleQuit}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                {t(locale, "quiz.quit")}
              </Button>
              <Badge variant="outline">
                {currentQuestionIndex + 1} / {questions.length}
              </Badge>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-blue h-2 rounded-full transition-all duration-300"
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
          <CardHeader className="p-5 sm:p-6">
            <QuizQuestionImage src={currentQuestionImageSrc} />
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <QuizQuestionTypeBadge type={currentQuestion.type} locale={locale} />
              {isLocked && !showCorrection && (
                <Badge variant="secondary">
                  {t(locale, "quiz.answerLocked")}
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl">
              <QuizRichText html={currentQuestion.label} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0 sm:p-6 sm:pt-0">
            {currentQuestion.options.map((option) => {
              const selected = isOptionSelected(option.id);
              const correct = isOptionCorrect(option.id);
              const incorrect = isOptionIncorrect(option.id);
              const optionLetter = String.fromCharCode(
                65 + currentQuestion.options.indexOf(option),
              );

              // Determine styling based on state
              let borderColor = "";
              let letterBgColor = "";
              let letterTextColor = "";

              if (showCorrection) {
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
                  // blue color for selected options
                  borderColor = "hsl(var(--blue))";
                  letterBgColor = "bg-blue";
                  letterTextColor = "text-blue-foreground";
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
                  disabled={isLocked}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                    !borderColor && "border-border",
                    isLocked
                      ? "cursor-not-allowed"
                      : "cursor-pointer hover:shadow-sm",
                    selected ? "border-b-4" : "",
                  )}
                  style={borderColor ? { borderColor } : undefined}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Letter badge */}
                    <div
                      className={cn(
                        "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-md font-semibold text-sm shrink-0 transition-colors",
                        letterBgColor,
                        letterTextColor,
                      )}
                    >
                      {optionLetter}
                    </div>
                    {/* Option text */}
                    <div className="flex-1 min-w-0">
                      <span className="text-base break-words">{option.label}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
          {showAnswerImmediately &&
            isVerified &&
            currentAnswer?.isCorrect === false &&
            currentQuestion.explanation?.trim() && (
              <div className="px-5 pb-4 sm:px-6">
                <Alert variant="info" className="border-blue/40 bg-blue/5">
                  <span className="font-medium">{t(locale, "quiz.explanation")}</span>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {currentQuestion.explanation.trim()}
                  </p>
                </Alert>
              </div>
            )}
          <CardFooter className="flex gap-4 p-5 pt-0 sm:p-6 sm:pt-0">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              {t(locale, "quiz.previous")}
            </Button>
            {showAnswerImmediately && !isLocked ? (
              <Button
                variant="blue"
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
                variant="blue"
                onClick={handleNext}
                disabled={!isAnswered && !isLocked}
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t(locale, "quiz.quit")}</DialogTitle>
              <DialogDescription>
                {t(locale, "quiz.quitConfirm")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowQuitConfirm(false)}>
                {t(locale, "common.cancel")}
              </Button>
              <Button variant="destructive" onClick={confirmQuit}>
                {t(locale, "quiz.quit")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {timeLimit > 0 &&
        activeTimedQuestionId &&
        activeTimedTimeRemaining !== null && (
        <QuizQuestionFloatingTimer
          timeLeftSeconds={activeTimedTimeRemaining}
          totalSeconds={timeLimit}
          locale={locale}
          viewedQuestionId={currentQuestion.id}
          activeTimedQuestionId={activeTimedQuestionId}
          onBackToCurrentQuestion={handleBackToActiveTimedQuestion}
        />
      )}
    </div>
  );
}
