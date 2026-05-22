"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveEffectiveQuizSettings } from "@/lib/quiz/resolveEffectiveQuizSettings";
import type { QuizPreviewQuestion } from "@/lib/quiz/quiz-preview-scoring";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";
import type { EffectiveQuizSettings } from "@/lib/quiz/resolveEffectiveQuizSettings";

export type QuizPreviewData = {
  quizId: string;
  quizName: string;
  quizStatus: QuizLifecycleStatus;
  settings: EffectiveQuizSettings;
  questions: QuizPreviewQuestion[];
};

export type GetQuizPreviewDataResult =
  | { success: true; data: QuizPreviewData }
  | { success: false; error: string };

/**
 * Owner-only quiz payload for immersive preview play (no QuizLink, no attempts).
 */
export async function getQuizPreviewData(
  quizId: string,
): Promise<GetQuizPreviewDataResult> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        name: true,
        status: true,
        ownerId: true,
        settings: true,
        questions: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            order: true,
            type: true,
            label: true,
            image: true,
            imageKey: true,
            explanation: true,
            options: {
              select: { id: true, label: true, isCorrect: true },
            },
          },
        },
      },
    });

    if (!quiz || quiz.ownerId !== session.user.id) {
      return { success: false, error: "Quiz not found or unauthorized" };
    }

    const settings = resolveEffectiveQuizSettings(quiz.settings);
    const questions: QuizPreviewQuestion[] = quiz.questions.map((question) => ({
      id: question.id,
      order: question.order,
      type: question.type,
      label: question.label,
      image: question.image,
      imageKey: question.imageKey,
      explanation: question.explanation,
      options: question.options.map((option) => ({
        id: option.id,
        label: option.label,
        isCorrect: option.isCorrect,
      })),
    }));

    return {
      success: true,
      data: {
        quizId: quiz.id,
        quizName: quiz.name,
        quizStatus: quiz.status as QuizLifecycleStatus,
        settings,
        questions,
      },
    };
  } catch (error) {
    console.error("getQuizPreviewData:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load preview",
    };
  }
}
