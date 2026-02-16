"use server";

import { prisma } from "@/lib/prisma";

export type PublicQuizItem = {
  id: string;
  name: string;
  questionsCount: number;
};

const DEFAULT_PAGE_SIZE = 12;

export async function getPublicQuizzesPage(
  page: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
  search?: string,
): Promise<{
  success: boolean;
  quizzes: PublicQuizItem[];
  total: number;
  error?: string;
}> {
  try {
    if (!prisma) {
      return {
        success: false,
        quizzes: [],
        total: 0,
        error: "Database not initialized",
      };
    }

    const where = {
      visibility: "PUBLIC" as const,
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
          _count: { select: { questions: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.quiz.count({ where }),
    ]);

    return {
      success: true,
      quizzes: quizzes.map((q) => ({
        id: q.id,
        name: q.name,
        questionsCount: q._count.questions,
      })),
      total,
    };
  } catch (error) {
    console.error("Error fetching public quizzes:", error);
    return {
      success: false,
      quizzes: [],
      total: 0,
      error: error instanceof Error ? error.message : "Failed to fetch quizzes",
    };
  }
}
