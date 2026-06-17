import { prisma } from "@/lib/prisma";

/**
 * Marks the first response activity on a quiz link (idempotent).
 * Does not write quota-unrelated expiration fields.
 */
export async function ensureQuizLinkResponseActivityStarted(
  quizLinkId: string,
  now: Date = new Date(),
): Promise<void> {
  if (!prisma) return;

  await prisma.quizLink.updateMany({
    where: { id: quizLinkId, responsesStartedAt: null },
    data: {
      responsesStartedAt: now,
    },
  });
}

export async function touchQuizLinkLastResponseAt(
  quizLinkId: string,
  now: Date = new Date(),
): Promise<void> {
  if (!prisma) return;

  await prisma.quizLink.update({
    where: { id: quizLinkId },
    data: { lastResponseAt: now },
  });
}
