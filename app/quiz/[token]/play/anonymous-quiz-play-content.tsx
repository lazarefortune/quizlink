"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
import { getQuestionImageSrc } from "@/lib/question-image-src";
import { QuizRichText } from "@/components/quiz/quiz-rich-text";
import { QuizQuestionTypeBadge } from "@/components/quiz/quiz-question-type-badge";
import { QuizQuestionFloatingTimer } from "@/components/quiz/quiz-question-floating-timer";
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
import { cn } from "@/lib/utils";
import {
  validateAnonymousQuestionAnswer,
  validateAnonymousQuizAnswers,
  type AnonymousQuizDetailRow,
  type AnonymousQuizQuestionPublic,
} from "@/app/quiz-link/anonymous-quiz-actions";
import { recordAnonymousQuizCompletion } from "@/app/quiz-link/anonymous-quiz-stats-actions";
import { track } from "@/lib/analytics/track";
import { ANONYMOUS_QUIZ_COMPLETED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";
import { saveAnonymousQuizResultToSession } from "@/lib/anonymousQuizResultSession";
import { AnonymousQuizFinishingScreen } from "./anonymous-quiz-finishing-screen";

type AnonymousQuizPlayContentProps = {
  token: string;
  quizId: string;
  quizName: string;
  settings: {
    showAnswerImmediately?: boolean;
    showAnswersAtEnd?: boolean;
    randomizeQuestions?: boolean;
    randomizeOptions?: boolean;
    timeLimitPerQuestion?: number | null;
  };
  allowMultipleAttempts: boolean;
  questions: AnonymousQuizQuestionPublic[];
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
  explanation?: string | null;
};

export function AnonymousQuizPlayContent({
  token,
  quizId,
  quizName,
  settings: initialSettings,
  allowMultipleAttempts: _allowMultipleAttempts,
  questions: initialQuestions,
}: AnonymousQuizPlayContentProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const [questions, setQuestions] = useState<AnonymousQuizQuestionPublic[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeTimedQuestionId, setActiveTimedQuestionId] = useState<string | null>(
    null,
  );
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishingStage, setFinishingStage] = useState<
    "scoring" | "preparing" | "redirecting"
  >("scoring");
  const [questionDirection, setQuestionDirection] = useState<1 | -1>(1);
  const sessionStartedAtRef = useRef<number>(Date.now());
  const handleFinishRef = useRef<() => Promise<void>>(async () => {});
  const answersRef = useRef<AnswerState[]>([]);
  const quizContainerRef = useRef<HTMLDivElement | null>(null);
  const questionStartedAtRef = useRef<number>(Date.now());
  const timeSpentByQuestionIdRef = useRef<Record<string, number>>({});
  const prefersReducedMotion = useReducedMotion();

  // Records the elapsed time for a given question into the ref and resets the
  // start marker so subsequent calls only add new deltas (idempotent).
  const recordTimeForQuestionId = useCallback((questionId: string) => {
    const now = Date.now();
    const elapsedSec = Math.max(
      0,
      Math.floor((now - questionStartedAtRef.current) / 1000),
    );
    questionStartedAtRef.current = now;
    if (elapsedSec <= 0) return;
    timeSpentByQuestionIdRef.current[questionId] =
      (timeSpentByQuestionIdRef.current[questionId] ?? 0) + elapsedSec;
  }, []);

  const settings = initialSettings;
  const timeLimit = settings.timeLimitPerQuestion ?? 0;

  useEffect(() => {
    const shuffle = resolveEffectiveShuffleSettings({
      randomizeQuestions: Boolean(settings.randomizeQuestions),
      randomizeOptions:
        typeof settings.randomizeOptions === "boolean"
          ? settings.randomizeOptions
          : undefined,
    });
    let quizQuestions = [...initialQuestions];
    if (shuffle.randomizeQuestions) {
      quizQuestions = quizQuestions.sort(() => Math.random() - 0.5);
    }
    if (shuffle.randomizeOptions) {
      quizQuestions = quizQuestions.map((q) => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5),
      }));
    }
    setQuestions(quizQuestions);
    const initialAnswers: AnswerState[] = quizQuestions.map((q) => ({
      questionId: q.id,
      selectedOptionIds: [],
      isVerified: false,
      isLocked: false,
      isExpired: false,
    }));
    answersRef.current = initialAnswers;
    setAnswers(initialAnswers);
    setCurrentQuestionIndex(0);
    setActiveTimedQuestionId(
      timeLimit > 0 && quizQuestions[0] ? quizQuestions[0].id : null,
    );
    sessionStartedAtRef.current = Date.now();
    timeSpentByQuestionIdRef.current = {};
    questionStartedAtRef.current = Date.now();
  }, [
    initialQuestions,
    settings.randomizeQuestions,
    settings.randomizeOptions,
  ]);

  useEffect(() => {
    if (questions.length === 0) return;
    questionStartedAtRef.current = Date.now();
    quizContainerRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [currentQuestionIndex, questions.length, prefersReducedMotion]);

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
      recordTimeForQuestionId(questionId);
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
            setQuestionDirection(1);
            setCurrentQuestionIndex(nextIndex);
            return;
          }
        }

        setActiveTimedQuestionId(null);
        void handleFinishRef.current();
      }, 500);
    },
    [
      questions,
      recordTimeForQuestionId,
      lockQuestionOnTimerExpire,
      buildAnswersByQuestionId,
    ],
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

    setQuestionDirection(targetIndex > currentQuestionIndex ? 1 : -1);
    setCurrentQuestionIndex(targetIndex);
  }, [activeTimedQuestionId, questions, currentQuestionIndex]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isQuizFinished) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isQuizFinished]);

  const submitAnswerForQuestion = useCallback(
    async (questionId: string, selectedOptionIds: string[]) => {
      setIsSubmitting(true);
      setError(null);

      if (!selectedOptionIds || selectedOptionIds.length === 0) {
        setError(t(locale, "quiz.noAnswer"));
        setIsSubmitting(false);
        return;
      }

      recordTimeForQuestionId(questionId);
      const timeSpent = timeSpentByQuestionIdRef.current[questionId] ?? 0;

      const result = await validateAnonymousQuestionAnswer(
        token,
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
              explanation: result.explanation,
              timeSpent,
            };
          }
          return a;
        });
        answersRef.current = next;
        return next;
      });
      setIsSubmitting(false);
    },
    [token, locale, recordTimeForQuestionId]
  );

  const handleAnswerSelect = (optionId: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);

    if (isQuizAnswerLocked(currentAnswer)) return;

    setAnswers((prev) => {
      const updatedAnswers = prev.map((a) => {
        if (a.questionId !== currentQuestion.id) return a;

        if (currentQuestion.type === "CHECKBOX") {
          const isSelected = a.selectedOptionIds.includes(optionId);
          return {
            ...a,
            selectedOptionIds: isSelected
              ? a.selectedOptionIds.filter((id) => id !== optionId)
              : [...a.selectedOptionIds, optionId],
          };
        }
        return {
          ...a,
          selectedOptionIds: [optionId],
        };
      });
      answersRef.current = updatedAnswers;
      return updatedAnswers;
    });
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
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);

    recordTimeForQuestionId(currentQuestion.id);

    if (settings.showAnswerImmediately) {
      if (
        currentAnswer &&
        !currentAnswer.isVerified &&
        currentAnswer.selectedOptionIds.length > 0
      ) {
        await submitAnswerForQuestion(currentQuestion.id, currentAnswer.selectedOptionIds);
      }
    } else if (timeLimit > 0 && currentAnswer && !currentAnswer.isLocked) {
      // Timed quiz without immediate verification: lock the answer on continue
      // so the user cannot edit it on revisit (timer would also not restart).
      setAnswers((prev) => {
        const next = prev.map((a) =>
          a.questionId === currentQuestion.id ? { ...a, isLocked: true } : a,
        );
        answersRef.current = next;
        return next;
      });
    }

    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      const answersByQuestionId = buildAnswersByQuestionId(answersRef.current);
      const nextActiveTimedQuestionId = findNextUnlockedQuestionId(
        questions,
        answersByQuestionId,
        currentQuestion.id,
      );

      setQuestionDirection(1);
      setCurrentQuestionIndex(nextIndex);
      if (timeLimit > 0) {
        setActiveTimedQuestionId(nextActiveTimedQuestionId);
      }
    } else {
      if (timeLimit > 0) {
        setActiveTimedQuestionId(null);
      }
      await handleFinishRef.current();
    }
  };

  const handleFinish = useCallback(async () => {
    const finishStartedAtMs = Date.now();
    const minimumVisibleMs = prefersReducedMotion ? 0 : 1100;
    const redirectPhaseMinMs = prefersReducedMotion ? 0 : 700;
    try {
      setError(null);
      setIsFinishing(true);
      setFinishingStage("scoring");
      answersRef.current = answers;

      const lastQuestion = questions[currentQuestionIndex];
      if (lastQuestion) {
        recordTimeForQuestionId(lastQuestion.id);
      }

      if (settings.showAnswerImmediately) {
        const currentQuestion = questions[currentQuestionIndex];
        const currentAnswer = answersRef.current.find((a) => a.questionId === currentQuestion.id);
        if (
          currentAnswer &&
          !currentAnswer.isVerified &&
          currentAnswer.selectedOptionIds.length > 0
        ) {
          await submitAnswerForQuestion(currentQuestion.id, currentAnswer.selectedOptionIds);
        }
      }

      const payload = questions.map((q) => {
        const a = answersRef.current.find((x) => x.questionId === q.id);
        return {
          questionId: q.id,
          selectedOptionIds: a?.selectedOptionIds ?? [],
        };
      });

      const result = await validateAnonymousQuizAnswers(
        token,
        payload,
        sessionStartedAtRef.current
      );

      if (!result.success) {
        setError(resolveQuizActionError(locale, result.error));
        setIsFinishing(false);
        return;
      }

      setFinishingStage("preparing");
      const statsResult = await recordAnonymousQuizCompletion(token, result.score);
      if (!statsResult.success) {
        console.error("recordAnonymousQuizCompletion:", statsResult.error);
      }

      const mergedDetails: (AnonymousQuizDetailRow & { timeSpent?: number })[] = result.details.map((row) => {
        const trackedTime = timeSpentByQuestionIdRef.current[row.questionId];
        return {
          ...row,
          timeSpent: trackedTime && trackedTime > 0 ? trackedTime : undefined,
        };
      });

      setIsQuizFinished(true);
      saveAnonymousQuizResultToSession(token, {
        quizId,
        quizName,
        score: result.score,
        totalQuestions: result.totalQuestions,
        correctAnswersCount: result.correctAnswersCount,
        durationSec: result.durationSec,
        showAnswerImmediately: settings?.showAnswerImmediately ?? true,
        showAnswersAtEnd: result.showAnswersAtEnd,
        details: mergedDetails,
        savedAt: Date.now(),
      });

      setFinishingStage("redirecting");
      const redirectPhaseStartedAtMs = Date.now();

      const elapsedMs = Date.now() - finishStartedAtMs;
      const remainingMs = minimumVisibleMs - elapsedMs;
      if (remainingMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingMs));
      }

      const redirectElapsedMs = Date.now() - redirectPhaseStartedAtMs;
      const redirectRemainingMs = redirectPhaseMinMs - redirectElapsedMs;
      if (redirectRemainingMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, redirectRemainingMs));
      }

      track(ANONYMOUS_QUIZ_COMPLETED, {
        ...buildCommonEventProps({ preferredLanguage: locale }),
        quiz_id: quizId,
        score_pct: result.score,
        question_count: result.totalQuestions,
        duration_sec: result.durationSec,
      });

      router.push(`/quiz/${token}/results`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finish quiz");
      setIsFinishing(false);
    }
  }, [
    questions,
    currentQuestionIndex,
    answers,
    token,
    quizId,
    quizName,
    router,
    locale,
    submitAnswerForQuestion,
    settings.showAnswerImmediately,
    recordTimeForQuestionId,
    prefersReducedMotion,
  ]);

  handleFinishRef.current = handleFinish;

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const currentQuestion = questions[currentQuestionIndex];
      if (currentQuestion) {
        recordTimeForQuestionId(currentQuestion.id);
      }
      setQuestionDirection(-1);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuit = () => {
    setShowQuitConfirm(true);
  };

  const confirmQuit = () => {
    setIsQuizFinished(true);
    setShowQuitConfirm(false);
    router.push(`/quiz/${token}`);
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
    <div
      ref={quizContainerRef}
      className={cn(
        "min-h-screen bg-background px-4 py-6 pb-28 sm:p-8",
        isFinishing && "pointer-events-none select-none",
      )}
    >
      <div className="mx-auto w-full max-w-none space-y-6 md:max-w-3xl">
        {error && <Alert variant="error">{error}</Alert>}

        <header className="space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h1 className="h1 text-xl sm:text-2xl font-semibold break-words flex-1">{quizName}</h1>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleQuit}
                disabled={isFinishing}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
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

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentQuestion.id}
            initial={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 0, x: questionDirection > 0 ? 24 : -24 }
            }
            animate={{ opacity: 1, x: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 0, x: questionDirection > 0 ? -24 : 24 }
            }
            transition={{ duration: prefersReducedMotion ? 0 : 0.26, ease: "easeOut" }}
          >
            <Card>
              <CardHeader className="p-5 sm:p-6">
                {currentQuestionImageSrc ? (
                  <div className="mb-4 relative w-full h-48 sm:h-64">
                    <Image
                      src={currentQuestionImageSrc}
                      alt="Question"
                      fill
                      className="object-contain rounded-md border"
                      unoptimized
                    />
                  </div>
                ) : null}
                <CardTitle className="text-xl font-medium mb-3">
                  <QuizRichText html={currentQuestion.label} />
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <QuizQuestionTypeBadge type={currentQuestion.type} locale={locale} />
                  {isLocked && !showCorrection && (
                    <Badge variant="secondary">
                      {t(locale, "quiz.answerLocked")}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-5 pt-0 sm:p-6 sm:pt-0">
                {currentQuestion.options.map((option) => {
                  const selected = isOptionSelected(option.id);
                  const correct = isOptionCorrect(option.id);
                  const incorrect = isOptionIncorrect(option.id);
                  const optionLetter = String.fromCharCode(
                    65 + currentQuestion.options.indexOf(option)
                  );

                  let borderColor = "";
                  let letterBgColor = "";
                  let letterTextColor = "";

                  if (showCorrection) {
                    if (correct) {
                      borderColor = "#22c55e";
                      letterBgColor = "bg-green-500";
                      letterTextColor = "text-white";
                    } else if (incorrect) {
                      borderColor = "#ef4444";
                      letterBgColor = "bg-red-500";
                      letterTextColor = "text-white";
                    } else {
                      letterBgColor = "bg-muted";
                      letterTextColor = "text-muted-foreground";
                    }
                  } else if (selected) {
                    borderColor = "hsl(var(--blue))";
                    letterBgColor = "bg-blue";
                    letterTextColor = "text-blue-foreground";
                  } else {
                    letterBgColor = "bg-muted";
                    letterTextColor = "text-muted-foreground";
                  }

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleAnswerSelect(option.id)}
                      disabled={isLocked}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                        !borderColor && "border-border",
                        isLocked ? "cursor-not-allowed" : "cursor-pointer hover:shadow-sm",
                        selected ? "border-b-4" : ""
                      )}
                      style={borderColor ? { borderColor } : undefined}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div
                          className={cn(
                            "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-md font-semibold text-sm shrink-0 transition-colors",
                            letterBgColor,
                            letterTextColor
                          )}
                        >
                          {optionLetter}
                        </div>
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
                currentAnswer.explanation?.trim() && (
                  <div className="px-5 pb-4 sm:px-6">
                    <Alert variant="info" className="border-blue/40 bg-blue/5">
                      <span className="font-medium">{t(locale, "quiz.explanation")}</span>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {currentAnswer.explanation.trim()}
                      </p>
                    </Alert>
                  </div>
                )}
              <CardFooter className="flex gap-4 p-5 pt-0 sm:p-6 sm:pt-0">
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0 || isFinishing}
                >
                  {t(locale, "quiz.previous")}
                </Button>
                {showAnswerImmediately && !isLocked ? (
                  <Button
                    variant="blue"
                    onClick={() => void handleVerify()}
                    disabled={!isAnswered || isSubmitting || isFinishing}
                    className="ml-auto"
                  >
                    {isSubmitting ? t(locale, "common.loading") : t(locale, "quiz.verify")}
                  </Button>
                ) : (
                  <Button
                    variant="blue"
                    onClick={() => void handleNext()}
                    disabled={(!isAnswered && !isLocked) || isFinishing}
                    className="ml-auto"
                  >
                    {currentQuestionIndex === questions.length - 1
                      ? t(locale, "quiz.finish")
                      : t(locale, "quiz.continue")}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>

        <Dialog open={showQuitConfirm} onOpenChange={setShowQuitConfirm}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{t(locale, "quiz.quit")}</DialogTitle>
              <DialogDescription>{t(locale, "quiz.quitConfirm")}</DialogDescription>
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
        activeTimedTimeRemaining !== null &&
        !isFinishing && (
        <QuizQuestionFloatingTimer
          timeLeftSeconds={activeTimedTimeRemaining}
          totalSeconds={timeLimit}
          locale={locale}
          viewedQuestionId={currentQuestion.id}
          activeTimedQuestionId={activeTimedQuestionId}
          onBackToCurrentQuestion={handleBackToActiveTimedQuestion}
        />
      )}
      {isFinishing && (
        <AnonymousQuizFinishingScreen
          stage={finishingStage}
          reducedMotion={Boolean(prefersReducedMotion)}
        />
      )}
    </div>
  );
}
