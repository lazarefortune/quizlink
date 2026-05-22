"use server";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { abandonQuizAttemptById } from "@/lib/quiz/abandon-quiz-attempt";
import { playBlockedErrorCodeForQuizStatus } from "@/lib/quiz/quizActionErrorCodes";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

type SubmitAnswerResponse =
  | {
      success: true;
      isCorrect: boolean;
      correctOptionIds?: string[];
    }
  | { success: false; error: string };

type FinishQuizResponse =
  | {
      success: true;
      score: number;
      totalQuestions: number;
      correctAnswers: number;
      durationSec?: number;
    }
  | { success: false; error: string };

/**
 * Submit an answer for a question (saves to database immediately)
 */
export async function submitAnswerForAttempt(
  attemptId: string,
  questionId: string,
  selectedOptionIds: string[],
  timeSpent?: number
): Promise<SubmitAnswerResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    // Get attempt with quiz data
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quizLink: {
          include: {
            quiz: {
              include: {
                questions: {
                  include: {
                    options: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return { success: false, error: "Attempt not found" };
    }

    if (attempt.status === "COMPLETED") {
      return { success: false, error: "Quiz already completed" };
    }

    const submitBlocked = playBlockedErrorCodeForQuizStatus(
      attempt.quizLink.quiz.status as QuizLifecycleStatus,
    );
    if (submitBlocked) {
      return { success: false, error: submitBlocked };
    }

    // Find the question
    const question = attempt.quizLink.quiz.questions.find(
      (q: { id: string; options: Array<{ id: string; isCorrect: boolean }> }) => q.id === questionId
    );

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    // Validate that selectedOptionIds are not empty
    if (!selectedOptionIds || selectedOptionIds.length === 0) {
      return { success: false, error: "Aucune réponse sélectionnée" };
    }

    // Validate that all selectedOptionIds are valid for this question
    const validOptionIds = new Set(question.options.map((opt: { id: string }) => opt.id));
    const invalidOptions = selectedOptionIds.filter((id) => !validOptionIds.has(id));
    if (invalidOptions.length > 0) {
      return { success: false, error: "Options invalides sélectionnées" };
    }

    // Get correct option IDs
    const correctOptionIds = question.options
      .filter((opt: { isCorrect: boolean }) => opt.isCorrect)
      .map((opt: { id: string }) => opt.id);

    // Check if answer is correct
    const userAnswerSet = new Set(selectedOptionIds);
    const correctAnswerSet = new Set(correctOptionIds);
    const isCorrect =
      userAnswerSet.size === correctAnswerSet.size &&
      [...userAnswerSet].every((id) => correctAnswerSet.has(id));

    // Check if answer already exists
    const existingAnswer = await prisma.quizAnswer.findFirst({
      where: {
        attemptId,
        questionId,
      },
    });

    if (existingAnswer) {
      // Update existing answer
      await prisma.quizAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          selectedOptionIds: selectedOptionIds as Prisma.InputJsonValue,
          isCorrect,
          timeSpent: timeSpent || null,
        },
      });
    } else {
      // Create new answer
      await prisma.quizAnswer.create({
        data: {
          attemptId,
          questionId,
          selectedOptionIds: selectedOptionIds as Prisma.InputJsonValue,
          isCorrect,
          timeSpent: timeSpent || null,
        },
      });
    }

    const settings = attempt.quizLink.quiz.settings as {
      showAnswerImmediately?: boolean;
    };

    return {
      success: true,
      isCorrect,
      correctOptionIds:
        settings.showAnswerImmediately ? correctOptionIds : undefined,
    };
  } catch (error) {
    console.error("Error submitting answer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit answer",
    };
  }
}

/**
 * Finish a quiz attempt
 */
export async function finishQuizAttempt(
  attemptId: string
): Promise<FinishQuizResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quizLink: {
          include: {
            quiz: {
              include: {
                questions: {
                  include: {
                    options: true,
                  },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      return { success: false, error: "Attempt not found" };
    }

    const totalQuestions = attempt.quizLink.quiz.questions.length;
    const correctAnswers = attempt.answers.filter((a: { isCorrect: boolean }) => a.isCorrect).length;
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    if (attempt.status === "COMPLETED") {
      const finishedAt = attempt.finishedAt ?? attempt.startedAt;
      const durationSec =
        finishedAt && attempt.startedAt
          ? Math.round((new Date(finishedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000)
          : undefined;
      return {
        success: true,
        score,
        totalQuestions,
        correctAnswers,
        durationSec,
      };
    }

    const finishInProgressBlocked = playBlockedErrorCodeForQuizStatus(
      attempt.quizLink.quiz.status as QuizLifecycleStatus,
    );
    if (finishInProgressBlocked) {
      return { success: false, error: finishInProgressBlocked };
    }

    const finishedAt = new Date();
    const durationSec = Math.round(
      (finishedAt.getTime() - new Date(attempt.startedAt).getTime()) / 1000
    );

    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: "COMPLETED",
        finishedAt,
        score,
      },
    });

    return {
      success: true,
      score,
      totalQuestions,
      correctAnswers,
      durationSec,
    };
  } catch (error) {
    console.error("Error finishing quiz:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to finish quiz",
    };
  }
}

/**
 * Abandon a quiz attempt
 */
export async function abandonQuizAttempt(
  attemptId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await abandonQuizAttemptById(attemptId);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error) {
    console.error("Error abandoning quiz:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to abandon quiz",
    };
  }
}
