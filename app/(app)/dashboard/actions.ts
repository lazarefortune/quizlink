"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { QuizBuilder } from "@/types/quiz-builder";
import { revalidatePath } from "next/cache";

// Check if user owns a quiz
async function checkQuizOwnership(quizId: string, userId: string): Promise<boolean> {
  if (!prisma) return false;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { ownerId: true },
  });

  return quiz?.ownerId === userId;
}

// Get a single quiz by ID (with ownership check)
export async function getQuizById(quizId: string) {
  try {
    if (!prisma) {
      return {
        success: false,
        error: "Database not initialized",
      };
    }

    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in",
      };
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!quiz) {
      return {
        success: false,
        error: "Quiz not found",
      };
    }

    // Check ownership
    if (quiz.ownerId !== session.user.id) {
      return {
        success: false,
        error: "You don't have permission to access this quiz",
      };
    }

    return {
      success: true,
      quiz: {
        id: quiz.id,
        name: quiz.name,
        visibility: quiz.visibility as "PRIVATE" | "PUBLIC",
        settings: quiz.settings as any,
        questions: quiz.questions.map((q: any) => ({
          id: q.id,
          type: q.type as "MULTIPLE_CHOICE" | "CHECKBOX" | "TRUE_FALSE",
          label: q.label,
          image: q.image || undefined,
          options: q.options.map((opt: any) => ({
            id: opt.id,
            label: opt.label,
            isCorrect: opt.isCorrect,
          })),
        })),
        createdAt: quiz.createdAt.toISOString(),
        updatedAt: quiz.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return {
      success: false,
      error: "Failed to fetch quiz",
    };
  }
}

// Update a quiz
export async function updateQuiz(quizId: string, quiz: QuizBuilder) {
  try {
    if (!prisma) {
      return {
        success: false,
        error: "Database not initialized",
      };
    }

    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in",
      };
    }

    // Check ownership
    const ownsQuiz = await checkQuizOwnership(quizId, session.user.id);
    if (!ownsQuiz) {
      return {
        success: false,
        error: "You don't have permission to update this quiz",
      };
    }

    // Delete existing questions and options, then recreate
    await prisma.$transaction([
      // Delete all options first (due to foreign key constraints)
      prisma.option.deleteMany({
        where: {
          question: {
            quizId,
          },
          },
        }),
      // Delete all questions
      prisma.question.deleteMany({
        where: { quizId },
      }),
      // Update quiz metadata
      prisma.quiz.update({
        where: { id: quizId },
        data: {
          name: quiz.name,
          visibility: quiz.visibility,
          settings: quiz.settings as any,
          questions: {
            create: quiz.questions.map((q, index) => ({
              type: q.type,
              label: q.label,
              image: q.image || null,
              order: index,
              options: {
                create: q.options.map((opt) => ({
                  label: opt.label,
                  isCorrect: opt.isCorrect,
                })),
              },
            })),
          },
        },
      }),
    ]);

    revalidatePath("/dashboard");
    revalidatePath(`/builder/${quizId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating quiz:", error);
    return {
      success: false,
      error: "Failed to update quiz",
    };
  }
}

// Delete a quiz
export async function deleteQuiz(quizId: string) {
  try {
    if (!prisma) {
      return {
        success: false,
        error: "Database not initialized",
      };
    }

    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in",
      };
    }

    // Check ownership
    const ownsQuiz = await checkQuizOwnership(quizId, session.user.id);
    if (!ownsQuiz) {
      return {
        success: false,
        error: "You don't have permission to delete this quiz",
      };
    }

    // Delete quiz (cascade will handle questions, options, attempts, answers)
    await prisma.quiz.delete({
      where: { id: quizId },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return {
      success: false,
      error: "Failed to delete quiz",
    };
  }
}

// Duplicate a quiz
export async function duplicateQuiz(quizId: string) {
  try {
    if (!prisma) {
      return {
        success: false,
        error: "Database not initialized",
      };
    }

    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in",
      };
    }

    // Get the original quiz
    const originalQuiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!originalQuiz) {
      return {
        success: false,
        error: "Quiz not found",
      };
    }

    // Check ownership
    if (originalQuiz.ownerId !== session.user.id) {
      return {
        success: false,
        error: "You don't have permission to duplicate this quiz",
      };
    }

    // Create duplicate
    const duplicatedQuiz = await prisma.quiz.create({
      data: {
        ownerId: session.user.id,
        name: `${originalQuiz.name} (Copy)`,
        visibility: originalQuiz.visibility,
        settings: originalQuiz.settings as any,
        questions: {
          create: originalQuiz.questions.map((q: any) => ({
            type: q.type,
            label: q.label,
            image: q.image,
            order: q.order,
            options: {
              create: q.options.map((opt: any) => ({
                label: opt.label,
                isCorrect: opt.isCorrect,
              })),
            },
          })),
        },
      },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      quizId: duplicatedQuiz.id,
    };
  } catch (error) {
    console.error("Error duplicating quiz:", error);
    return {
      success: false,
      error: "Failed to duplicate quiz",
    };
  }
}
