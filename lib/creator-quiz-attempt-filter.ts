import type { Prisma } from "@prisma/client";

/**
 * Creator-facing statistics and lists only include attempts tied to a participant.
 * Public-link plays are aggregated in quiz_link_anonymous_stats; this filter excludes
 * rows without participantId so creator views stay identified-attempts only.
 */
export const creatorCountedAttemptWhere: Prisma.QuizAttemptWhereInput = {
  participantId: { not: null },
};
