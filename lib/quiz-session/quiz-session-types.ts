// Public question model (sent to client)
export type PublicQuestion = {
  id: string;
  type: "MCQ" | "TRUE_FALSE" | "CHECKBOX";
  label: string;
  image?: string;
  options: PublicQuestionOption[];
};

export type PublicQuestionOption = {
  id: string;
  label: string;
};

// Private answer model (server-side only)
export type PrivateAnswer = {
  questionId: string;
  correctOptionIds: string[];
};

// Quiz session (server-side only)
export type QuizSession = {
  id: string;
  quizId: string;
  title: string;
  settings: {
    showAnswerImmediately: boolean;
    randomizeQuestions: boolean;
    timeLimitPerQuestion: number | null;
  };
  publicQuestions: PublicQuestion[];
  privateAnswers: PrivateAnswer[];
  userAnswers: Record<string, string[]>; // questionId -> selectedOptionIds[] (serializable)
  score: number;
  createdAt: Date;
};

// Response types
export type StartQuizResponse = {
  success: true;
  quizSessionId: string;
  title: string;
  settings: QuizSession["settings"];
  questions: PublicQuestion[];
} | {
  success: false;
  error: string;
};

export type SubmitAnswerResponse = {
  success: true;
  isCorrect: boolean;
  correctOptionIds?: string[]; // Only if showAnswerImmediately is true
} | {
  success: false;
  error: string;
};

export type GetResultsResponse = {
  success: true;
  totalQuestions: number;
  correctAnswersCount: number;
  detailedResults: Array<{
    questionId: string;
    isCorrect: boolean;
  }>;
} | {
  success: false;
  error: string;
};
