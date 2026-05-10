import type { Prisma } from "@prisma/client";

/**
 * Creator-facing statistics and lists only include attempts tied to a Participant.
 * Anonymous attempts (public link, participantId null) are excluded from these aggregates.
 */
export const creatorCountedAttemptWhere: Prisma.QuizAttemptWhereInput = {
  participantId: { not: null },
};
