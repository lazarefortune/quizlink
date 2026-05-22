"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { QuizShareLinkDialog } from "@/components/dashboard/quiz-detail/quiz-share-link-dialog";
import { QuizPlayHeader } from "@/components/quiz-play/quiz-play-header";
import { QuizPlayLayout } from "@/components/quiz-play/quiz-play-layout";
import { QuizPlayQuestionCard } from "@/components/quiz-play/quiz-play-question-card";
import { QuizPreviewBanner } from "@/components/quiz-play/quiz-preview-banner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuizQuestionFloatingTimer } from "@/components/quiz/quiz-question-floating-timer";
import { applyQuizPlayShuffle } from "@/lib/quiz/applyQuizPlayShuffle";
import {
  isQuizAnswerLocked,
  shouldShowQuizAnswerCorrection,
} from "@/lib/quiz/quizAnswerLock";
import {
  findNextUnlockedQuestionId,
  findQuestionIndexById,
} from "@/lib/quiz/quizActiveTimedQuestion";
import {
  computeQuizPreviewFinishResult,
  gradeQuizPreviewAnswer,
  type QuizPreviewDetailRow,
  type QuizPreviewQuestion,
} from "@/lib/quiz/quiz-preview-scoring";
import type { EffectiveQuizSettings } from "@/lib/quiz/resolveEffectiveQuizSettings";
import { getQuestionImageSrc } from "@/lib/question-image-src";
import { usePrefetchQuestionImages } from "@/lib/quiz/usePrefetchQuestionImages";
import { useQuizQuestionTimer } from "@/lib/quiz/useQuizQuestionTimer";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

import { QuizPreviewResults } from "./quiz-preview-results";

type AnswerState = {
  questionId: string;
  selectedOptionIds: string[];
  isVerified: boolean;
  isLocked: boolean;
  isExpired: boolean;
  isCorrect?: boolean;
  correctOptionIds?: string[];
};

type QuizPreviewPlayerProps = {
  quizId: string;
  quizName: string;
  quizStatus: QuizLifecycleStatus;
  settings: EffectiveQuizSettings;
  questions: QuizPreviewQuestion[];
};

type PreviewFinishState = {
  score: number;
  totalQuestions: number;
  correctAnswersCount: number;
  showAnswersAtEnd: boolean;
  details: QuizPreviewDetailRow[];
};

function buildInitialAnswers(questions: QuizPreviewQuestion[]): AnswerState[] {
  return questions.map((question) => ({
    questionId: question.id,
    selectedOptionIds: [],
    isVerified: false,
    isLocked: false,
    isExpired: false,
  }));
}

export function QuizPreviewPlayer({
  quizId,
  quizName,
  quizStatus,
  settings,
  questions: sourceQuestions,
}: QuizPreviewPlayerProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const [playSessionKey, setPlaySessionKey] = useState(0);
  const [questions, setQuestions] = useState<QuizPreviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeTimedQuestionId, setActiveTimedQuestionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const answersRef = useRef<AnswerState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finishState, setFinishState] = useState<PreviewFinishState | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [questionDirection, setQuestionDirection] = useState<1 | -1>(1);
  const prefersReducedMotion = useReducedMotion();
  const handleFinishRef = useRef<() => Promise<void>>(async () => {});

  const timeLimit = settings.timeLimitPerQuestion ?? 0;
  const showAnswerImmediately = settings.showAnswerImmediately;

  const initializePlaySession = useCallback(() => {
    const shuffled = applyQuizPlayShuffle(sourceQuestions, {
      randomizeQuestions: settings.randomizeQuestions,
      randomizeOptions: settings.randomizeOptions,
    });
    const initialAnswers = buildInitialAnswers(shuffled);
    setQuestions(shuffled);
    setAnswers(initialAnswers);
    answersRef.current = initialAnswers;
    setCurrentQuestionIndex(0);
    setActiveTimedQuestionId(
      timeLimit > 0 && shuffled[0] ? shuffled[0].id : null,
    );
    setFinishState(null);
    setError(null);
  }, [
    sourceQuestions,
    settings.randomizeOptions,
    settings.randomizeQuestions,
    timeLimit,
  ]);

  useEffect(() => {
    initializePlaySession();
  }, [initializePlaySession, playSessionKey]);

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
      const next = prev.map((answer) =>
        answer.questionId === questionId
          ? { ...answer, isExpired: true, isLocked: true }
          : answer,
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

  const verifyAnswerLocally = useCallback(
    (questionId: string, selectedOptionIds: string[]) => {
      const question = questions.find((item) => item.id === questionId);
      if (!question) {
        return;
      }

      const graded = gradeQuizPreviewAnswer(
        question,
        selectedOptionIds,
        showAnswerImmediately,
      );

      setAnswers((prev) => {
        const next = prev.map((answer) => {
          if (answer.questionId !== questionId) {
            return answer;
          }
          return {
            ...answer,
            isVerified: true,
            isLocked: true,
            isCorrect: graded.isCorrect,
            correctOptionIds: graded.correctOptionIds,
          };
        });
        answersRef.current = next;
        return next;
      });
    },
    [questions, showAnswerImmediately],
  );

  const submitAnswerForQuestion = useCallback(
    async (questionId: string, selectedOptionIds: string[]) => {
      setIsSubmitting(true);
      setError(null);

      if (!selectedOptionIds || selectedOptionIds.length === 0) {
        setError(t(locale, "quiz.noAnswer"));
        setIsSubmitting(false);
        return;
      }

      verifyAnswerLocally(questionId, selectedOptionIds);
      setIsSubmitting(false);
    },
    [locale, verifyAnswerLocally],
  );

  const handleAnswerSelect = (optionId: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers.find((answer) => answer.questionId === currentQuestion.id);

    if (isQuizAnswerLocked(currentAnswer)) {
      return;
    }

    const updatedAnswers = answers.map((answer) => {
      if (answer.questionId !== currentQuestion.id) {
        return answer;
      }

      if (currentQuestion.type === "CHECKBOX") {
        const isSelected = answer.selectedOptionIds.includes(optionId);
        return {
          ...answer,
          selectedOptionIds: isSelected
            ? answer.selectedOptionIds.filter((id) => id !== optionId)
            : [...answer.selectedOptionIds, optionId],
        };
      }

      return {
        ...answer,
        selectedOptionIds: [optionId],
      };
    });

    setAnswers(updatedAnswers);
    answersRef.current = updatedAnswers;
  };

  const handleVerify = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers.find((answer) => answer.questionId === currentQuestion.id);

    if (!currentAnswer || currentAnswer.selectedOptionIds.length === 0) {
      setError(t(locale, "quiz.noAnswer"));
      return;
    }

    await submitAnswerForQuestion(currentQuestion.id, currentAnswer.selectedOptionIds);
  };

  const lockAnswerForFinish = useCallback(
    (answer: AnswerState, question: QuizPreviewQuestion): AnswerState => {
      if (answer.isVerified || answer.selectedOptionIds.length === 0) {
        return answer;
      }

      if (showAnswerImmediately) {
        const graded = gradeQuizPreviewAnswer(
          question,
          answer.selectedOptionIds,
          showAnswerImmediately,
        );
        return {
          ...answer,
          isVerified: true,
          isLocked: true,
          isCorrect: graded.isCorrect,
          correctOptionIds: graded.correctOptionIds,
        };
      }

      return {
        ...answer,
        isVerified: true,
        isLocked: true,
      };
    },
    [showAnswerImmediately],
  );

  const handleFinish = useCallback(async () => {
    try {
      setError(null);

      const finalizedAnswers = answersRef.current.map((answer) => {
        const question = questions.find((item) => item.id === answer.questionId);
        if (!question) {
          return answer;
        }
        return lockAnswerForFinish(answer, question);
      });

      answersRef.current = finalizedAnswers;
      setAnswers(finalizedAnswers);

      const payload = questions.map((question) => {
        const answer = finalizedAnswers.find((item) => item.questionId === question.id);
        return {
          questionId: question.id,
          selectedOptionIds: answer?.selectedOptionIds ?? [],
        };
      });

      const result = computeQuizPreviewFinishResult(questions, payload, {
        showAnswersAtEnd: settings.showAnswersAtEnd,
      });

      setFinishState({
        score: result.score,
        totalQuestions: result.totalQuestions,
        correctAnswersCount: result.correctAnswersCount,
        showAnswersAtEnd: result.showAnswersAtEnd,
        details: result.details,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finish preview");
    }
  }, [lockAnswerForFinish, questions, settings.showAnswersAtEnd]);

  handleFinishRef.current = handleFinish;

  const handleNext = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers.find((answer) => answer.questionId === currentQuestion.id);

    if (
      currentAnswer &&
      !currentAnswer.isVerified &&
      currentAnswer.selectedOptionIds.length > 0
    ) {
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

      setQuestionDirection(1);
      setCurrentQuestionIndex(nextIndex);
      if (timeLimit > 0) {
        setActiveTimedQuestionId(nextActiveTimedQuestionId);
      }
      return;
    }

    if (timeLimit > 0) {
      setActiveTimedQuestionId(null);
    }
    await handleFinish();
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setQuestionDirection(-1);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const confirmQuit = () => {
    setShowQuitConfirm(false);
    router.push(`/dashboard/quiz/${quizId}`);
  };

  if (finishState) {
    return (
      <>
        <QuizPreviewResults
          quizId={quizId}
          quizName={quizName}
          quizStatus={quizStatus}
          score={finishState.score}
          totalQuestions={finishState.totalQuestions}
          correctAnswersCount={finishState.correctAnswersCount}
          showAnswersAtEnd={finishState.showAnswersAtEnd}
          details={finishState.details}
          onReplay={() => setPlaySessionKey((value) => value + 1)}
          onShare={
            quizStatus === "ACTIVE"
              ? () => setShowShareDialog(true)
              : undefined
          }
        />
        <QuizShareLinkDialog
          quizId={quizId}
          quizStatus={quizStatus}
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
        />
      </>
    );
  }

  if (questions.length === 0) {
    return (
      <QuizPlayLayout topBanner={<QuizPreviewBanner quizId={quizId} />}>
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="text-muted-foreground">{t(locale, "builder.noQuestions")}</p>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/quiz/${quizId}`}>
              {t(locale, "quiz.previewBackToQuiz")}
            </Link>
          </Button>
        </div>
      </QuizPlayLayout>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentQuestionImageSrc = getQuestionImageSrc({
    image: currentQuestion.image,
    imageKey: currentQuestion.imageKey,
  });
  const currentAnswer = answers.find((answer) => answer.questionId === currentQuestion.id);
  const isVerified = currentAnswer?.isVerified ?? false;
  const isLocked = isQuizAnswerLocked(currentAnswer);
  const showCorrection = shouldShowQuizAnswerCorrection({
    isVerified,
    showAnswerImmediately,
  });

  const isAnswered = Boolean(
    currentAnswer && currentAnswer.selectedOptionIds.length > 0,
  );

  const isOptionCorrect = (optionId: string) => {
    if (!showCorrection) {
      return false;
    }
    return currentAnswer?.correctOptionIds?.includes(optionId) ?? false;
  };

  const isOptionSelected = (optionId: string) =>
    currentAnswer?.selectedOptionIds.includes(optionId) ?? false;

  const isOptionIncorrect = (optionId: string) => {
    if (!showCorrection) {
      return false;
    }
    return isOptionSelected(optionId) && !isOptionCorrect(optionId);
  };

  return (
    <>
      <QuizPlayLayout topBanner={<QuizPreviewBanner quizId={quizId} />}>
        {error ? <Alert variant="error">{error}</Alert> : null}

        <QuizPlayHeader
          quizName={quizName}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          onQuit={() => setShowQuitConfirm(true)}
        />

        {isTimeUp ? (
          <Alert variant="error">
            {t(locale, "quiz.timeRemaining")}: 0 {t(locale, "quiz.seconds")}
          </Alert>
        ) : null}

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
            <QuizPlayQuestionCard
              questionType={currentQuestion.type}
              questionLabel={currentQuestion.label}
              questionImageSrc={currentQuestionImageSrc}
              options={currentQuestion.options}
              isLocked={isLocked}
              showCorrection={showCorrection}
              showAnswerImmediately={showAnswerImmediately}
              isVerified={isVerified}
              isCorrect={currentAnswer?.isCorrect}
              explanation={currentQuestion.explanation}
              isOptionSelected={isOptionSelected}
              isOptionCorrect={isOptionCorrect}
              isOptionIncorrect={isOptionIncorrect}
              onSelectOption={handleAnswerSelect}
              onPrevious={handlePrevious}
              onVerify={
                showAnswerImmediately && !isLocked
                  ? () => void handleVerify()
                  : undefined
              }
              onNext={() => void handleNext()}
              isFirstQuestion={currentQuestionIndex === 0}
              isLastQuestion={currentQuestionIndex === questions.length - 1}
              isAnswered={isAnswered}
              isSubmitting={isSubmitting}
            />
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
      </QuizPlayLayout>

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
    </>
  );
}
