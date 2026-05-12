import type { QuizBuilder } from "@/types/quiz-builder";

/**
 * Approximates the byte size of the quiz as JSON (UTF-8), close to what a Server Action
 * must carry when the full `QuizBuilder` is serialized.
 */
export function estimateQuizPayloadSize(quiz: QuizBuilder): number {
  const json = JSON.stringify(quiz);
  return new TextEncoder().encode(json).length;
}
