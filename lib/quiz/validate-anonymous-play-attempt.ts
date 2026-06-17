import { prisma } from "@/lib/prisma";
import { playBlockedErrorCodeForQuizStatus } from "@/lib/quiz/quizActionErrorCodes";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";
import {
  isParticipantIdentityMode,
  type ParticipantIdentityMode,
} from "@/types/participant-identity";

const PUBLIC_PLAY_IDENTITY_MODES: ParticipantIdentityMode[] = [
  "ANONYMOUS",
  "PSEUDONYM",
  "NAME_EMAIL",
];

function isPublicPlayIdentityMode(identityMode: string): identityMode is ParticipantIdentityMode {
  return isParticipantIdentityMode(identityMode) && PUBLIC_PLAY_IDENTITY_MODES.includes(identityMode);
}

export type AnonymousPlayAttemptResolution =
  | { status: "in_progress"; attemptId: string }
  | { status: "not_found" }
  | { status: "token_mismatch" }
  | { status: "completed" }
  | { status: "abandoned" }
  | { status: "blocked"; errorCode: string }
  | { status: "invalid_id" };

/**
 * Verifies that an attempt belongs to the quiz link token and can be played.
 */
export async function validateAnonymousPlayAttempt(
  token: string,
  attemptId: string | undefined | null,
): Promise<AnonymousPlayAttemptResolution> {
  if (!prisma) {
    return { status: "not_found" };
  }

  const trimmedToken = token?.trim();
  const trimmedAttemptId = attemptId?.trim();

  if (!trimmedToken || !trimmedAttemptId) {
    return { status: "invalid_id" };
  }

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: trimmedAttemptId },
    select: {
      id: true,
      status: true,
      identityMode: true,
      quizLink: {
        select: {
          token: true,
          participantId: true,
          quiz: { select: { status: true } },
        },
      },
    },
  });

  if (!attempt) {
    return { status: "not_found" };
  }

  if (attempt.quizLink.token !== trimmedToken) {
    return { status: "token_mismatch" };
  }

  if (
    attempt.quizLink.participantId !== null ||
    !isPublicPlayIdentityMode(attempt.identityMode)
  ) {
    return { status: "token_mismatch" };
  }

  const blocked = playBlockedErrorCodeForQuizStatus(
    attempt.quizLink.quiz.status as QuizLifecycleStatus,
  );
  if (blocked) {
    return { status: "blocked", errorCode: blocked };
  }

  if (attempt.status === "COMPLETED") {
    return { status: "completed" };
  }

  if (attempt.status === "ABANDONED") {
    return { status: "abandoned" };
  }

  if (attempt.status !== "IN_PROGRESS") {
    return { status: "not_found" };
  }

  return { status: "in_progress", attemptId: attempt.id };
}
