import type { UserQuizListExpiration } from "@/app/(app)/builder/actions";
import type { QuizLinkExpirationStatus } from "@/lib/quiz/quizLinkExpirationStatus";

export function deserializeQuizLinkExpirationStatus(
  expiration: UserQuizListExpiration,
): QuizLinkExpirationStatus {
  return {
    status: expiration.status,
    acceptingResponsesUntil:
      expiration.acceptingResponsesUntil != null
        ? new Date(expiration.acceptingResponsesUntil)
        : null,
    isExpired: expiration.isExpired,
    hasStarted: expiration.hasStarted,
    isUnlocked: expiration.isUnlocked,
    titleKey: expiration.titleKey,
    descriptionKey: expiration.descriptionKey,
    listLabelKey: expiration.listLabelKey,
    daysRemaining: expiration.daysRemaining,
  };
}
