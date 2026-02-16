"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { QuizBuilder } from "@/types/quiz-builder";
import { revalidatePath } from "next/cache";

export async function saveQuiz(quiz: QuizBuilder, quizId?: string) {
  try {
    if (!prisma) {
      return {
        success: false,
        error: "Database not initialized. Please run 'pnpm prisma:generate' first.",
      };
    }

    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to save a quiz",
      };
    }

    // If quizId is provided, update existing quiz
    if (quizId) {
      // Check ownership
      const existingQuiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        select: { ownerId: true },
      });

      if (!existingQuiz || existingQuiz.ownerId !== session.user.id) {
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
        quizId,
      };
    }

    // Create new quiz
    const savedQuiz = await prisma.quiz.create({
      data: {
        ownerId: session.user.id,
        name: quiz.name,
        visibility: quiz.visibility,
        settings: quiz.settings as any,
        questions: {
          create: quiz.questions.map((q, index) => ({
            type: q.type,
            label: q.label,
            image: q.image || null,
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

    revalidatePath("/dashboard");
    revalidatePath(`/builder/${savedQuiz.id}`);

    return {
      success: true,
      quizId: savedQuiz.id,
    };
  } catch (error) {
    console.error("Error saving quiz:", error);
    return {
      success: false,
      error: "Failed to save quiz",
    };
  }
}

export async function getUserQuizzes() {
  try {
    if (!prisma) {
      return {
        success: false,
        error: "Database not initialized. Please run 'pnpm prisma:generate' first.",
        quizzes: [],
      };
    }

    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in",
        quizzes: [],
      };
    }

    const quizzes = await prisma.quiz.findMany({
      where: {
        ownerId: session.user.id,
      },
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
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Get all quiz links and attempts separately
    const quizIds = quizzes.map((q: any) => q.id);
    const quizLinks = await prisma.quizLink.findMany({
      where: {
        quizId: { in: quizIds },
      },
      include: {
        attempts: {
          select: {
            id: true,
            startedAt: true,
            finishedAt: true,
            score: true,
            status: true,
            participant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            startedAt: "desc",
          },
        },
      },
    });

    // Group attempts by quizId
    const attemptsByQuizId = new Map<string, any[]>();
    for (const link of quizLinks) {
      if (!attemptsByQuizId.has(link.quizId)) {
        attemptsByQuizId.set(link.quizId, []);
      }
      const attempts = link.attempts.map((attempt: any) => ({
        id: attempt.id,
        participantName: attempt.participant?.name || "Unknown",
        startedAt: attempt.startedAt,
        finishedAt: attempt.finishedAt,
        score: attempt.score,
        status: attempt.status,
      }));
      attemptsByQuizId.get(link.quizId)!.push(...attempts);
    }

    return {
      success: true,
      quizzes: quizzes.map((quiz: any) => ({
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
        attempts: attemptsByQuizId.get(quiz.id) || [],
        createdAt: quiz.createdAt instanceof Date
          ? quiz.createdAt.toISOString()
          : new Date(quiz.createdAt).toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch quizzes",
      quizzes: [],
    };
  }
}

export type UserQuizListItem = {
  id: string;
  name: string;
  visibility: "PRIVATE" | "PUBLIC";
  questionCount: number;
  attemptCount: number;
  createdAt: string;
};

const DEFAULT_PAGE_SIZE = 12;

export async function getUserQuizzesPaginated(
  page: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
  search?: string,
): Promise<{
  success: boolean;
  quizzes: UserQuizListItem[];
  total: number;
  error?: string;
}> {
  try {
    if (!prisma) {
      return {
        success: false,
        quizzes: [],
        total: 0,
        error: "Database not initialized. Please run 'pnpm prisma:generate' first.",
      };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        quizzes: [],
        total: 0,
        error: "You must be logged in",
      };
    }

    const where = {
      ownerId: session.user.id,
      ...(search?.trim()
        ? { name: { contains: search.trim() } }
        : {}),
    };

    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        select: {
          id: true,
          name: true,
          visibility: true,
          createdAt: true,
          _count: { select: { questions: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.quiz.count({ where }),
    ]);

    const quizIds = quizzes.map((q) => q.id);
    const linksWithCounts = await prisma.quizLink.findMany({
      where: { quizId: { in: quizIds } },
      select: {
        quizId: true,
        _count: { select: { attempts: true } },
      },
    });

    const attemptCountByQuizId = new Map<string, number>();
    for (const link of linksWithCounts) {
      const current = attemptCountByQuizId.get(link.quizId) ?? 0;
      attemptCountByQuizId.set(link.quizId, current + link._count.attempts);
    }

    return {
      success: true,
      quizzes: quizzes.map((q) => ({
        id: q.id,
        name: q.name,
        visibility: q.visibility as "PRIVATE" | "PUBLIC",
        questionCount: q._count.questions,
        attemptCount: attemptCountByQuizId.get(q.id) ?? 0,
        createdAt:
          q.createdAt instanceof Date
            ? q.createdAt.toISOString()
            : new Date(q.createdAt).toISOString(),
      })),
      total,
    };
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return {
      success: false,
      quizzes: [],
      total: 0,
      error: error instanceof Error ? error.message : "Failed to fetch quizzes",
    };
  }
}
