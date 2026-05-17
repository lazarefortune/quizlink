"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS } from "@/lib/builder/defaultManualQuizSettings";
import { prisma } from "@/lib/prisma";
import { t, type Locale } from "@/lib/i18n";

function normalizeCreateDraftLocale(locale: unknown): Locale {
  return locale === "en" ? "en" : "fr";
}

export type CreateDraftQuizResult =
  | { success: true; quizId: string }
  | { success: false; error: string };

/**
 * Creates or reuses an empty manual quiz (DRAFT) for the signed-in user; the client redirects to `/builder/{quizId}`.
 * Requires a non-empty trimmed quiz name (default title is applied client-side when the user skips naming).
 */
export async function createDraftQuizAction(
  localeInput: unknown = "fr",
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

    const locale = normalizeCreateDraftLocale(localeInput);
    const name = typeof nameInput === "string" ? nameInput.trim() : "";
    if (name.length === 0) {
      return { success: false, error: t(locale, "builder.quizNameRequired") };
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

    if (reusableEmptyDraft) {
      await prisma.quiz.update({
        where: { id: reusableEmptyDraft.id },
        data: { name },
      });
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/quizzes");
      revalidatePath("/dashboard/create");
      return { success: true, quizId: reusableEmptyDraft.id };
    }

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
