"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { UNLOCK_QUIZ_ERROR } from "@/lib/quiz/quizUnlockConstants";
import { unlockQuizWithCoins } from "@/lib/quiz/unlockQuizWithCoins";

export type UnlockQuizWithCoinsActionResponse =
  | {
      success: true;
      alreadyUnlocked: boolean;
      newBalance: number;
    }
  | { success: false; error: string };

export async function unlockQuizWithCoinsAction(
  quizId: string,
): Promise<UnlockQuizWithCoinsActionResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: UNLOCK_QUIZ_ERROR.UNAUTHORIZED };
  }

  const result = await unlockQuizWithCoins(quizId, session.user.id);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath(`/dashboard/quiz/${quizId}`);

  return {
    success: true,
    alreadyUnlocked: result.alreadyUnlocked,
    newBalance: result.newBalance,
  };
}
