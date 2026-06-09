"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { deductCoins } from "@/lib/coins";
import { creatorCountedAttemptWhere } from "@/lib/creator-quiz-attempt-filter";
import { batchResolveQuizCompletedCounts } from "@/lib/quiz/batchResolveQuizCompletedCounts";
import { batchResolveQuizExpirationStatusForOwner } from "@/lib/quiz/batchResolveQuizExpirationStatusForOwner";
import { prisma } from "@/lib/prisma";
import {
  copyQuestionImageStorageObject,
  deleteQuestionImage,
  isSafeQuestionImageStorageKey,
} from "@/lib/storage/question-image-storage";
import { QUIZ_ACTION_ERROR_CODE } from "@/lib/quiz/quizActionErrorCodes";
import { canQuizBeMadePublic } from "@/lib/quiz/quizStatusPolicy";
import { sanitizeQuizRichText } from "@/lib/rich-text/sanitizeQuizRichText";
import type { QuizBuilder } from "@/types/quiz-builder";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

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

    const [user, quizCount, participantCount, attemptStats, recentQuizzes, serverDraftQuizzes] =
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
            status: true,
            publishedAt: true,
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
        prisma.quiz.findMany({
          where: { ownerId: userId, status: "DRAFT" },
          select: { id: true },
        }),
      ]);

    const recentQuizIds = recentQuizzes.map((quiz) => quiz.id);
    const [completedCountByQuizId, expirationByQuizId] = await Promise.all([
      batchResolveQuizCompletedCounts(recentQuizIds),
      batchResolveQuizExpirationStatusForOwner(userId, recentQuizIds),
    ]);

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
        recentQuizzes: recentQuizzes.map((q) => {
          const expiration = expirationByQuizId.get(q.id);
          return {
            id: q.id,
            name: q.name,
            status: q.status as QuizLifecycleStatus,
            publishedAt:
              q.publishedAt instanceof Date
                ? q.publishedAt.toISOString()
                : q.publishedAt
                  ? new Date(q.publishedAt).toISOString()
                  : null,
            updatedAt: q.updatedAt.toISOString(),
            questionCount: q._count.questions,
            attemptCount: completedCountByQuizId.get(q.id) ?? 0,
            expiration:
              q.status === "ACTIVE" && expiration
                ? {
                    status: expiration.status,
                    acceptingResponsesUntil:
                      expiration.acceptingResponsesUntil?.toISOString() ?? null,
                    isExpired: expiration.isExpired,
                    hasStarted: expiration.hasStarted,
                    isUnlocked: expiration.isUnlocked,
                    titleKey: expiration.titleKey,
                    descriptionKey: expiration.descriptionKey,
                    listLabelKey: expiration.listLabelKey,
                    daysRemaining: expiration.daysRemaining,
                  }
                : undefined,
          };
        }),
        serverDraftQuizIds: serverDraftQuizzes.map((q) => q.id),
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
        status: quiz.status as QuizLifecycleStatus,
        publishedAt: quiz.publishedAt ? quiz.publishedAt.toISOString() : null,
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
                label: sanitizeQuizRichText(q.label),
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

    const ownerId = session.user.id;

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
    if (originalQuiz.ownerId !== ownerId) {
      return {
        success: false,
        error: "You don't have permission to duplicate this quiz",
      };
    }

    for (const q of originalQuiz.questions) {
      if (q.imageKey && !isSafeQuestionImageStorageKey(q.imageKey)) {
        return {
          success: false,
          error: "Invalid question image reference on source quiz",
        };
      }
    }

    const writtenStorageKeys: string[] = [];
    let duplicatedQuizId: string | null = null;

    try {
      const duplicatedQuiz = await prisma.quiz.create({
        data: {
          ownerId: ownerId,
          name: `${originalQuiz.name} (Copy)`,
          visibility: originalQuiz.visibility,
          status: originalQuiz.status,
          publishedAt: originalQuiz.publishedAt,
          settings: originalQuiz.settings as Prisma.InputJsonValue,
          questions: {
            create: originalQuiz.questions.map((q) => ({
              type: q.type,
              label: q.label,
              image: q.imageKey ? null : q.image,
              imageKey: null,
              explanation: q.explanation,
              order: q.order,
              options: {
                create: q.options.map((opt) => ({
                  label: opt.label,
                  isCorrect: opt.isCorrect,
                })),
              },
            })),
          },
        },
        include: {
          questions: {
            orderBy: { order: "asc" },
            select: { id: true, order: true },
          },
        },
      });

      duplicatedQuizId = duplicatedQuiz.id;

      for (let i = 0; i < originalQuiz.questions.length; i += 1) {
        const sourceQuestion = originalQuiz.questions[i];
        const newQuestion = duplicatedQuiz.questions[i];
        if (!sourceQuestion.imageKey) {
          continue;
        }
        const newKey = await copyQuestionImageStorageObject({
          sourceKey: sourceQuestion.imageKey,
          targetUserId: ownerId,
          targetQuizId: duplicatedQuiz.id,
        });
        writtenStorageKeys.push(newKey);
        await prisma.question.update({
          where: { id: newQuestion.id },
          data: { imageKey: newKey },
        });
      }

      revalidatePath("/dashboard");

      return {
        success: true,
        quizId: duplicatedQuiz.id,
      };
    } catch (innerError) {
      if (duplicatedQuizId !== null) {
        await prisma.quiz.delete({ where: { id: duplicatedQuizId } }).catch(() => {
          // best-effort cleanup
        });
      }
      for (const key of writtenStorageKeys) {
        await deleteQuestionImage(key).catch(() => {
          // best-effort cleanup of copied blobs only
        });
      }
      console.error("Error duplicating quiz:", innerError);
      return {
        success: false,
        error: "Failed to duplicate quiz",
      };
    }
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
        status: true,
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

    if (!canQuizBeMadePublic(quiz.status as QuizLifecycleStatus)) {
      return {
        success: false as const,
        error: QUIZ_ACTION_ERROR_CODE.MAKE_PUBLIC_REQUIRES_ACTIVE,
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
