export type SourceType = "TEXT" | "PDF";

export type QuestionType = "MCQ" | "TRUE_FALSE" | "CHECKBOX";

export type Question = {
  id: string;
  quizId: string;
  type: QuestionType;
  question: string;
  choices: string[];
  correctAnswer: number | number[];
  image?: string;
  imageKey?: string;
};

export type QuizSettings = {
  showAnswerImmediately: boolean;
  /**
   * Show the per-question answer details on the recap page at the end of the quiz.
   * Defaults to true when missing to preserve behavior for older quizzes.
   */
  showAnswersAtEnd?: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  timeLimitPerQuestion: number | null;
  autoSaveEnabled?: boolean;
};

export type Quiz = {
  id: string;
  title: string;
  sourceType: SourceType;
  expiresAt: Date | null;
  ownerId: string | null;
  createdAt: Date;
  questions: Question[];
  settings?: QuizSettings;
};
