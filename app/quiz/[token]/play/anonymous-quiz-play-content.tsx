"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
    randomizeQuestions?: boolean;
    timeLimitPerQuestion?: number | null;
  };
  allowMultipleAttempts: boolean;
  questions: AnonymousQuizQuestionPublic[];
};

type AnswerState = {
  questionId: string;
  selectedOptionIds: string[];
  isVerified: boolean;
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
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishingStage, setFinishingStage] = useState<"scoring" | "preparing">("scoring");
  const [questionDirection, setQuestionDirection] = useState<1 | -1>(1);
  const sessionStartedAtRef = useRef<number>(Date.now());
  const handleFinishRef = useRef<() => Promise<void>>(async () => {});
  const answersRef = useRef<AnswerState[]>([]);
  const quizContainerRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const settings = initialSettings;
  const timeLimit = settings.timeLimitPerQuestion ?? 0;
  const isTimerDanger = timeRemaining !== null && timeLimit > 0 && timeRemaining <= 10;
  const isTimerWarning =
    timeRemaining !== null && timeLimit > 0 && timeRemaining <= 20 && timeRemaining > 10;

  useEffect(() => {
    let quizQuestions = [...initialQuestions];
    if (settings.randomizeQuestions) {
      quizQuestions = quizQuestions.sort(() => Math.random() - 0.5);
      quizQuestions = quizQuestions.map((q) => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5),
      }));
    }
    setQuestions(quizQuestions);
    const initialAnswers = quizQuestions.map((q) => ({
      questionId: q.id,
      selectedOptionIds: [] as string[],
      isVerified: false,
    }));
    answersRef.current = initialAnswers;
    setAnswers(initialAnswers);
    setCurrentQuestionIndex(0);
    sessionStartedAtRef.current = Date.now();
  }, [initialQuestions, settings.randomizeQuestions]);

  useEffect(() => {
    if (questions.length === 0) return;
    setQuestionStartTime(Date.now());
    quizContainerRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [currentQuestionIndex, questions.length, prefersReducedMotion]);

  const currentQuestionForTimer = questions[currentQuestionIndex];
  const isCurrentAnswerVerified =
    (currentQuestionForTimer &&
      answers.find((a) => a.questionId === currentQuestionForTimer.id)?.isVerified) ??
    false;

  useEffect(() => {
    if (!settings.timeLimitPerQuestion || questions.length === 0) {
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    if (isCurrentAnswerVerified) {
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
        setTimeout(() => {
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((i) => i + 1);
          } else {
            void handleFinishRef.current();
          }
        }, 500);
        setTimeRemaining(0);
      } else {
        setTimeRemaining(timerValue);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    currentQuestionIndex,
    settings.timeLimitPerQuestion,
    questions.length,
    isCurrentAnswerVerified,
  ]);

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

      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

      const result = await validateAnonymousQuestionAnswer(
        token,
        questionId,
        selectedOptionIds,
        timeSpent
      );

      if (!result.success) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      setAnswers((prev) => {
        const next = prev.map((a) => {
          if (a.questionId === questionId) {
            return {
              ...a,
              isVerified: true,
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
    [token, questionStartTime, locale]
  );

  const handleAnswerSelect = (optionId: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);

    if (currentAnswer?.isVerified) return;

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

    if (settings.showAnswerImmediately) {
      if (
        currentAnswer &&
        !currentAnswer.isVerified &&
        currentAnswer.selectedOptionIds.length > 0
      ) {
        await submitAnswerForQuestion(currentQuestion.id, currentAnswer.selectedOptionIds);
      }
    }

    if (currentQuestionIndex < questions.length - 1) {
      setQuestionDirection(1);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      await handleFinishRef.current();
    }
  };

  const handleFinish = useCallback(async () => {
    const finishStartedAtMs = Date.now();
    const minimumVisibleMs = 700;
    try {
      setError(null);
      setIsFinishing(true);
      setFinishingStage("scoring");
      answersRef.current = answers;

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
        setError(result.error);
        setIsFinishing(false);
        return;
      }

      setFinishingStage("preparing");
      const statsResult = await recordAnonymousQuizCompletion(token, result.score);
      if (!statsResult.success) {
        console.error("recordAnonymousQuizCompletion:", statsResult.error);
      }

      const mergedDetails: (AnonymousQuizDetailRow & { timeSpent?: number })[] = result.details.map((row) => {
        const fromAnswers = answersRef.current.find((a) => a.questionId === row.questionId);
        return {
          ...row,
          timeSpent: fromAnswers?.timeSpent,
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
        details: mergedDetails,
        savedAt: Date.now(),
      });

      const elapsedMs = Date.now() - finishStartedAtMs;
      const remainingMs = minimumVisibleMs - elapsedMs;
      if (remainingMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingMs));
      }
      router.push(`/quiz/${token}/results`);

      track(ANONYMOUS_QUIZ_COMPLETED, {
        ...buildCommonEventProps({ preferredLanguage: locale }),
        quiz_id: quizId,
        score_pct: result.score,
        question_count: result.totalQuestions,
        duration_sec: result.durationSec,
      });
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
  ]);

  handleFinishRef.current = handleFinish;

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
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
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);
  const showAnswerImmediately = settings?.showAnswerImmediately ?? false;
  const isVerified = currentAnswer?.isVerified ?? false;

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isAnswered = currentAnswer && currentAnswer.selectedOptionIds.length > 0;

  const getQuestionDescription = () => {
    if (currentQuestion.type === "MULTIPLE_CHOICE") {
      return t(locale, "quiz.selectCorrectAnswer");
    }
    if (currentQuestion.type === "CHECKBOX") {
      return t(locale, "quiz.selectAllCorrectAnswers");
    }
    return t(locale, "quiz.selectTrueOrFalse");
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
    <div ref={quizContainerRef} className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {error && <Alert variant="error">{error}</Alert>}

        <header className="space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h1 className="h1 text-xl sm:text-2xl font-bold break-words flex-1">{quizName}</h1>
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

          {timeRemaining !== null && timeLimit > 0 && (
            <div className="mt-4">
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 font-semibold tabular-nums transition-colors",
                  isTimerDanger &&
                    "bg-destructive/15 text-destructive border border-destructive/40 animate-pulse",
                  isTimerWarning &&
                    !isTimerDanger &&
                    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40",
                  !isTimerWarning &&
                    !isTimerDanger &&
                    "bg-muted/80 text-muted-foreground border border-border"
                )}
              >
                <Clock className={cn("h-4 w-4 shrink-0")} />
                <span>
                  {timeRemaining} {t(locale, "quiz.seconds")}
                </span>
              </div>
            </div>
          )}
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
              <CardHeader>
                {currentQuestion.image && (
                  <div className="mb-4 relative w-full h-64">
                    <Image
                      src={currentQuestion.image}
                      alt="Question"
                      fill
                      className="object-contain rounded-md border"
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
                  const optionLetter = String.fromCharCode(
                    65 + currentQuestion.options.indexOf(option)
                  );

                  let borderColor = "";
                  let letterBgColor = "";
                  let letterTextColor = "";

                  if (isVerified) {
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
                      disabled={isVerified}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                        !borderColor && "border-border",
                        isVerified ? "cursor-not-allowed" : "cursor-pointer hover:shadow-sm",
                        selected ? "border-b-4" : ""
                      )}
                      style={borderColor ? { borderColor } : undefined}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-md font-semibold text-sm shrink-0 transition-colors",
                            letterBgColor,
                            letterTextColor
                          )}
                        >
                          {optionLetter}
                        </div>
                        <div className="flex-1">
                          <span className="text-base">{option.label}</span>
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
                  <div className="px-6 pb-4">
                    <Alert variant="info" className="border-blue/40 bg-blue/5">
                      <span className="font-medium">{t(locale, "quiz.explanation")}</span>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {currentAnswer.explanation.trim()}
                      </p>
                    </Alert>
                  </div>
                )}
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
                    variant="blue"
                    onClick={() => void handleVerify()}
                    disabled={!isAnswered || isSubmitting}
                    className="ml-auto"
                  >
                    {isSubmitting ? t(locale, "common.loading") : t(locale, "quiz.verify")}
                  </Button>
                ) : (
                  <Button
                    variant="blue"
                    onClick={() => void handleNext()}
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
          </motion.div>
        </AnimatePresence>

        <Dialog open={showQuitConfirm} onOpenChange={setShowQuitConfirm}>
          <DialogContent>
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
      {isFinishing && (
        <AnonymousQuizFinishingScreen
          stage={finishingStage}
          reducedMotion={Boolean(prefersReducedMotion)}
        />
      )}
    </div>
  );
}
