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
