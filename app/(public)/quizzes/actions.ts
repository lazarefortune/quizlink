"use server";

import { prisma } from "@/lib/prisma";

export type PublicQuizItem = {
  id: string;
  name: string;
  questionsCount: number;
};

export async function getPublicQuizzes(): Promise<{
  success: boolean;
  quizzes: PublicQuizItem[];
  error?: string;
}> {
  try {
    if (!prisma) {
      return { success: false, quizzes: [], error: "Database not initialized" };
    }

    const quizzes = await prisma.quiz.findMany({
      where: { visibility: "PUBLIC" },
      select: {
        id: true,
        name: true,
        _count: { select: { questions: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return {
      success: true,
      quizzes: quizzes.map((q) => ({
        id: q.id,
        name: q.name,
        questionsCount: q._count.questions,
      })),
    };
  } catch (error) {
    console.error("Error fetching public quizzes:", error);
    return {
      success: false,
      quizzes: [],
      error: error instanceof Error ? error.message : "Failed to fetch quizzes",
    };
  }
}
