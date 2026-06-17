import type { ParticipantIdentityMode } from "@/types/participant-identity";

export type QuizVisibility = "PRIVATE" | "PUBLIC";

export type QuestionType = "MULTIPLE_CHOICE" | "CHECKBOX" | "TRUE_FALSE";

export type CreatedBy = "ANONYMOUS" | "USER";

export type QuestionOption = {
  id: string;
  label: string;
  isCorrect: boolean;
};

export type Question = {
  id: string;
  type: QuestionType;
  label: string;
  /** Legacy: data URL or remote URL while migrating to imageKey + served URL */
  image?: string;
  /** Storage object key (local path segments or future S3 key) */
  imageKey?: string;
  /** Shown when the user gets the question wrong (results page) */
  explanation?: string;
  options: QuestionOption[];
};

export type QuizSettings = {
  /** How public quiz players identify themselves (V1 participants). */
  participantIdentityMode?: ParticipantIdentityMode;
  /** Show correction right after answering each question. */
  showAnswerImmediately: boolean;
  /**
   * Show the per-question answer details on the recap page at the end of the quiz.
   * Defaults to true when missing to preserve behavior for older quizzes.
   */
  showAnswersAtEnd?: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  timeLimitPerQuestion: number | null;
  /** When false, draft server autosave is off; omit or true = autosave enabled (default). */
  autoSaveEnabled?: boolean;
};

export type QuizBuilder = {
  id: string;
  name: string;
  visibility: QuizVisibility;
  settings: QuizSettings;
  questions: Question[];
  createdBy: CreatedBy;
  createdAt: string;
};
