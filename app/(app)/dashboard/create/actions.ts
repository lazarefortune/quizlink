"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS } from "@/lib/builder/defaultManualQuizSettings";
import { prisma } from "@/lib/prisma";

export type CreateDraftQuizResult =
  | { success: true; quizId: string }
  | { success: false; error: string };

/**
 * Creates an empty manual quiz (DRAFT) for the signed-in user, then the client redirects to `/builder/{quizId}`.
 */
export async function createDraftQuizAction(
  _localeInput: unknown = "fr"
): Promise<CreateDraftQuizResult> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const reusableEmptyDraft = await prisma.quiz.findFirst({
      where: {
        ownerId: session.user.id,
        status: "DRAFT",
        questions: { none: {} },
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });

    const quizId =
      reusableEmptyDraft?.id ??
      (
        await prisma.quiz.create({
          data: {
            ownerId: session.user.id,
            name: "",
            visibility: "PRIVATE",
            status: "DRAFT",
            settings: DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS as Prisma.InputJsonValue,
          },
        })
      ).id;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/quizzes");
    revalidatePath("/dashboard/create");

    return { success: true, quizId };
  } catch (error) {
    console.error("createDraftQuizAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create draft quiz",
    };
  }
}
