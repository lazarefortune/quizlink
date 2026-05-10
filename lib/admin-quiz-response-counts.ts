/**
 * Admin-facing response counts: anonymous completions from aggregated stats only;
 * identified completions from QuizAttempt (participantId set, COMPLETED).
 */

export type AdminLinkResponseInput = {
  participantId: string | null;
  anonymousCompletedCount: number;
  identifiedCompletedCount: number;
};

export type AdminLinkResponseCounts = {
  anonymousResponsesCount: number;
  identifiedResponsesCount: number;
  totalResponsesCount: number;
};

export function computeAdminLinkResponseCounts(
  input: AdminLinkResponseInput
): AdminLinkResponseCounts {
  if (input.participantId === null) {
    const anonymousResponsesCount = input.anonymousCompletedCount;
    return {
      anonymousResponsesCount,
      identifiedResponsesCount: 0,
      totalResponsesCount: anonymousResponsesCount,
    };
  }

  return {
    anonymousResponsesCount: 0,
    identifiedResponsesCount: input.identifiedCompletedCount,
    totalResponsesCount: input.identifiedCompletedCount,
  };
}

export function sumAdminQuizResponseCounts(
  links: AdminLinkResponseCounts[]
): AdminLinkResponseCounts {
  let anonymousResponsesCount = 0;
  let identifiedResponsesCount = 0;
  for (const link of links) {
    anonymousResponsesCount += link.anonymousResponsesCount;
    identifiedResponsesCount += link.identifiedResponsesCount;
  }
  return {
    anonymousResponsesCount,
    identifiedResponsesCount,
    totalResponsesCount: anonymousResponsesCount + identifiedResponsesCount,
  };
}
