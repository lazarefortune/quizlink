"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";

import { auth } from "@/lib/auth";
import { DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS } from "@/lib/builder/defaultManualQuizSettings";
import { prisma } from "@/lib/prisma";

export type CreateDraftQuizResult =
  | { success: true; quizId: string }
  | { success: false; error: string };

/**
 * Creates a new empty manual quiz (DRAFT) for the signed-in user; the client redirects to `/builder/{quizId}`.
 * Each explicit create action yields a distinct draft so users can keep multiple in-progress quizzes.
 * An empty trimmed name is allowed — the user must set a real title in the builder before adding questions.
 */
export async function createDraftQuizAction(
  _localeInput: unknown = "fr",
  nameInput: unknown,
): Promise<CreateDraftQuizResult> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const name = typeof nameInput === "string" ? nameInput.trim() : "";

    const quiz = await prisma.quiz.create({
      data: {
        ownerId: session.user.id,
        name,
        visibility: "PRIVATE",
        status: "DRAFT",
        settings: DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/quizzes");
    revalidatePath("/dashboard/create");

    return { success: true, quizId: quiz.id };
  } catch (error) {
    console.error("createDraftQuizAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create draft quiz",
    };
  }
}
