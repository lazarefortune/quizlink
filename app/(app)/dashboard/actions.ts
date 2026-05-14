"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { QuizBuilder } from "@/types/quiz-builder";
import { revalidatePath } from "next/cache";
import { deductCoins } from "@/lib/coins";
import type { Prisma } from "@prisma/client";
import { creatorCountedAttemptWhere } from "@/lib/creator-quiz-attempt-filter";

// Get dashboard statistics for the current user
export async function getDashboardStats() {
  try {
    if (!prisma) {
      return { success: false as const, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false as const, error: "You must be logged in" };
    }

    const userId = session.user.id;

    const [user, quizCount, participantCount, attemptStats, recentQuizzes] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { coinBalance: true },
        }),
        // Total quizzes owned
        prisma.quiz.count({ where: { ownerId: userId } }),
        // Total participants created by user
        prisma.participant.count({ where: { createdByUserId: userId } }),
        // Attempt stats across all user's quizzes
        prisma.quizAttempt.aggregate({
          where: {
            ...creatorCountedAttemptWhere,
            quizLink: { quiz: { ownerId: userId } },
          },
          _count: { id: true },
          _avg: { score: true },
        }),
        // 5 most recent quizzes with attempt count
        prisma.quiz.findMany({
          where: { ownerId: userId },
          orderBy: { updatedAt: "desc" },
          take: 5,
          select: {
            id: true,
            name: true,
            updatedAt: true,
            _count: {
              select: {
                questions: true,
                links: {
                  where: {
                    attempts: { some: { ...creatorCountedAttemptWhere } },
                  },
                },
              },
            },
            links: {
              select: {
                _count: {
                  select: {
                    attempts: {
                      where: {
                        ...creatorCountedAttemptWhere,
                        status: "COMPLETED",
                      },
                    },
                  },
                },
                id: true,
              },
            },
          },
        }),
      ]);

    const recentQuizIds = recentQuizzes.map((quiz) => quiz.id);
    const anonymousStatsRows =
      recentQuizIds.length > 0
        ? await prisma.quizLinkAnonymousStats.findMany({
            where: {
              quizLink: {
                quizId: { in: recentQuizIds },
              },
            },
            select: {
              completedCount: true,
              quizLink: {
                select: {
                  quizId: true,
                },
              },
            },
          })
        : [];

    const anonymousResponseCountByQuizId = new Map<string, number>();
    for (const row of anonymousStatsRows) {
      const quizId = row.quizLink.quizId;
      const current = anonymousResponseCountByQuizId.get(quizId) ?? 0;
      anonymousResponseCountByQuizId.set(quizId, current + row.completedCount);
    }

    const completedAttempts = await prisma.quizAttempt.count({
      where: {
        ...creatorCountedAttemptWhere,
        quizLink: { quiz: { ownerId: userId } },
        status: "COMPLETED",
      },
    });

    const totalAttempts = attemptStats._count.id;
    const averageScore = attemptStats._avg.score;
    const completionRate =
      totalAttempts > 0
        ? Math.round((completedAttempts / totalAttempts) * 100)
        : 0;

    return {
      success: true as const,
      stats: {
        coinBalance: user?.coinBalance ?? 0,
        quizCount,
        participantCount,
        totalAttempts,
        completedAttempts,
        averageScore: averageScore !== null ? Math.round(averageScore) : null,
        completionRate,
        recentQuizzes: recentQuizzes.map((q) => ({
          id: q.id,
          name: q.name,
          updatedAt: q.updatedAt.toISOString(),
          questionCount: q._count.questions,
          attemptCount:
            q.links.reduce((sum, l) => sum + l._count.attempts, 0) +
            (anonymousResponseCountByQuizId.get(q.id) ?? 0),
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { success: false as const, error: "Failed to fetch stats" };
  }
}

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
        settings: quiz.settings as Prisma.InputJsonValue,
        questions: quiz.questions.map((q: { id: string; type: string; label: string; image: string | null; imageKey: string | null; explanation: string | null; options: { id: string; label: string; isCorrect: boolean }[] }) => ({
          id: q.id,
          type: q.type as "MULTIPLE_CHOICE" | "CHECKBOX" | "TRUE_FALSE",
          label: q.label,
          image: q.image || undefined,
          imageKey: q.imageKey || undefined,
          explanation: q.explanation ?? undefined,
          options: q.options.map((opt: { id: string; label: string; isCorrect: boolean }) => ({
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

    const answersOnQuiz = await prisma.quizAnswer.count({
      where: { question: { quizId } },
    });
    if (answersOnQuiz > 0) {
      return {
        success: false,
        error:
          "Ce quiz a des réponses enregistrées. Dupliquez le quiz pour le modifier sans perdre les statistiques.",
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
          settings: quiz.settings as Prisma.InputJsonValue,
            questions: {
              create: quiz.questions.map((q, index) => ({
                type: q.type,
                label: q.label,
                image: q.imageKey ? null : (q.image || null),
                imageKey: q.imageKey || null,
                explanation: q.explanation?.trim() || null,
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

    // QuizAnswer has onDelete: Restrict on questionId, so we must manually
    // delete answers before the cascade reaches the questions.
    await prisma.$transaction(async (tx) => {
      const links = await tx.quizLink.findMany({
        where: { quizId },
        select: { id: true },
      });

      if (links.length > 0) {
        const linkIds = links.map((l) => l.id);
        const attempts = await tx.quizAttempt.findMany({
          where: { quizLinkId: { in: linkIds } },
          select: { id: true },
        });

        if (attempts.length > 0) {
          await tx.quizAnswer.deleteMany({
            where: { attemptId: { in: attempts.map((a) => a.id) } },
          });
        }
      }

      // Cascade now handles: QuizLinks → QuizAttempts, Questions → Options
      await tx.quiz.delete({ where: { id: quizId } });
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
        settings: originalQuiz.settings as Prisma.InputJsonValue,
        questions: {
          create: originalQuiz.questions.map((q: { type: string; label: string; image: string | null; imageKey: string | null; order: number; options: Array<{ label: string; isCorrect: boolean }> }) => ({
            type: q.type,
            label: q.label,
            image: q.imageKey ? null : (q.image || null),
            imageKey: q.imageKey || null,
            order: q.order,
            options: {
              create: q.options.map((opt: { label: string; isCorrect: boolean }) => ({
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

/**
 * Make a quiz public by spending coins.
 *
 * Business rules:
 * - Only the owner can change visibility.
 * - If the quiz is already public, this is a no-op.
 * - Regular users must spend 6 coins to make a quiz public.
 * - Admins can make quizzes public without spending coins.
 */
export async function makeQuizPublicWithCoins(quizId: string) {
  try {
    if (!prisma) {
      return {
        success: false as const,
        error: "Database not initialized",
      };
    }

    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false as const,
        error: "You must be logged in",
      };
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        ownerId: true,
        visibility: true,
      },
    });

    if (!quiz) {
      return {
        success: false as const,
        error: "Quiz not found",
      };
    }

    if (quiz.ownerId !== userId) {
      return {
        success: false as const,
        error: "You don't have permission to update this quiz",
      };
    }

    if (quiz.visibility === "PUBLIC") {
      return {
        success: true as const,
      };
    }

    if (userRole !== "ADMIN") {
      const { success, error } = await deductCoins(
        userId,
        6,
        "Make quiz public",
      );

      if (!success) {
        if (error === "Insufficient coins") {
          return {
            success: false as const,
            error: "INSUFFICIENT_COINS_FOR_PUBLIC",
          };
        }

        return {
          success: false as const,
          error: error ?? "Failed to deduct coins",
        };
      }
    }

    await prisma.quiz.update({
      where: { id: quizId },
      data: { visibility: "PUBLIC" },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/quiz/${quizId}`);
    revalidatePath("/quizzes");

    return {
      success: true as const,
    };
  } catch (error) {
    console.error("Error making quiz public with coins:", error);
    return {
      success: false as const,
      error: "Failed to make quiz public",
    };
  }
}
