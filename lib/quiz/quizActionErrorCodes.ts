import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

export const QUIZ_ACTION_ERROR_CODE = {
  PLAY_DRAFT: "QUIZ_PLAY_DRAFT",
  PLAY_ARCHIVED: "QUIZ_PLAY_ARCHIVED",
  SHARE_REQUIRES_ACTIVE: "QUIZ_SHARE_REQUIRES_ACTIVE",
  MAKE_PUBLIC_REQUIRES_ACTIVE: "MAKE_PUBLIC_REQUIRES_ACTIVE",
  NO_LONGER_ACCEPTING_RESPONSES: "QUIZ_NO_LONGER_ACCEPTING_RESPONSES",
} as const;

export type QuizActionErrorCode =
  (typeof QUIZ_ACTION_ERROR_CODE)[keyof typeof QUIZ_ACTION_ERROR_CODE];

export function playBlockedErrorCodeForQuizStatus(
  status: QuizLifecycleStatus
): QuizActionErrorCode | null {
  if (status === "DRAFT") {
    return QUIZ_ACTION_ERROR_CODE.PLAY_DRAFT;
  }
  if (status === "ARCHIVED") {
    return QUIZ_ACTION_ERROR_CODE.PLAY_ARCHIVED;
  }
  return null;
}
