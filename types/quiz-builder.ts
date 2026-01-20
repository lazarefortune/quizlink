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
  image?: string;
  options: QuestionOption[];
};

export type QuizSettings = {
  showAnswerImmediately: boolean;
  randomizeQuestions: boolean;
  timeLimitPerQuestion: number | null;
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
