import type { QuizSettings } from "@/types/quiz-builder";

/**
 * Default quiz settings for manual creation (aligned with `loadInitialQuiz` in the builder).
 */
export const DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS: QuizSettings = {
  showAnswerImmediately: true,
  showAnswersAtEnd: true,
  randomizeQuestions: false,
  randomizeOptions: false,
  timeLimitPerQuestion: null,
  autoSaveEnabled: true,
};
