import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

/**
 * Editorial lifecycle rules (visibility is separate).
 * Not yet wired into play/share flows — used for upcoming guards and UI.
 */
export function canQuizBePlayed(status: QuizLifecycleStatus): boolean {
  return status === "ACTIVE";
}

export function canQuizBeShared(status: QuizLifecycleStatus): boolean {
  return status === "ACTIVE";
}

export function canQuizBeMadePublic(status: QuizLifecycleStatus): boolean {
  return status === "ACTIVE";
}

/** Identified responses / share-style stats are only meaningful for published (ACTIVE) quizzes. */
export function canQuizShowResponseInsights(status: QuizLifecycleStatus): boolean {
  return status === "ACTIVE";
}
