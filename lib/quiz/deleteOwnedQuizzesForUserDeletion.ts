import type { Prisma } from "@/generated/prisma/client";

/**
 * Removes quizzes owned by a user before account deletion.
 * QuizAnswer and QuizAttemptQuestion reference Question with onDelete: Restrict,
 * so they must be deleted before the quiz cascade reaches questions.
 */
export async function deleteOwnedQuizzesForUserDeletion(
  tx: Prisma.TransactionClient,
  ownerId: string,
): Promise<void> {
  const ownedQuizzes = await tx.quiz.findMany({
    where: { ownerId },
    select: { id: true },
  });

  const quizIds = ownedQuizzes.map((quiz) => quiz.id);
  if (quizIds.length === 0) {
    return;
  }

  await tx.quizAnswer.deleteMany({
    where: { attempt: { quizLink: { quizId: { in: quizIds } } } },
  });

  await tx.quizAttemptQuestion.deleteMany({
    where: { attempt: { quizLink: { quizId: { in: quizIds } } } },
  });

  await tx.quiz.deleteMany({
    where: { id: { in: quizIds } },
  });
}
