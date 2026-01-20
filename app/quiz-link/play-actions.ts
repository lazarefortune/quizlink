"use server";

import { prisma } from "@/lib/prisma";

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

    // Find the question
    const question = attempt.quizLink.quiz.questions.find(
      (q: any) => q.id === questionId
    );

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    // Validate that selectedOptionIds are not empty
    if (!selectedOptionIds || selectedOptionIds.length === 0) {
      return { success: false, error: "Aucune réponse sélectionnée" };
    }

    // Validate that all selectedOptionIds are valid for this question
    const validOptionIds = new Set(question.options.map((opt: any) => opt.id));
    const invalidOptions = selectedOptionIds.filter((id) => !validOptionIds.has(id));
    if (invalidOptions.length > 0) {
      return { success: false, error: "Options invalides sélectionnées" };
    }

    // Get correct option IDs
    const correctOptionIds = question.options
      .filter((opt: any) => opt.isCorrect)
      .map((opt: any) => opt.id);

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
          selectedOptionIds: selectedOptionIds as any,
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
          selectedOptionIds: selectedOptionIds as any,
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

    if (attempt.status === "COMPLETED") {
      // Return existing results
      const totalQuestions = attempt.quizLink.quiz.questions.length;
      const correctAnswers = attempt.answers.filter((a: any) => a.isCorrect).length;
      const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      return {
        success: true,
        score,
        totalQuestions,
        correctAnswers,
      };
    }

    // Calculate score
    const totalQuestions = attempt.quizLink.quiz.questions.length;
    const correctAnswers = attempt.answers.filter((a: any) => a.isCorrect).length;
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    // Update attempt
    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: "COMPLETED",
        finishedAt: new Date(),
        score,
      },
    });

    return {
      success: true,
      score,
      totalQuestions,
      correctAnswers,
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
  attemptId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: "ABANDONED",
        finishedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error abandoning quiz:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to abandon quiz",
    };
  }
}
