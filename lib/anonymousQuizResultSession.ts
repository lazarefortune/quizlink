export type AnonymousQuizResultDetail = {
  questionId: string;
  questionLabel: string;
  questionImage: string | null;
  isCorrect: boolean;
  selectedOptionIds: string[];
  selectedOptionLabels: string[];
  correctOptionIds: string[];
  correctOptionLabels: string[];
  explanation: string | null;
  timeSpent?: number;
};

export type AnonymousQuizResultSession = {
  quizId: string;
  quizName: string;
  score: number;
  totalQuestions: number;
  correctAnswersCount: number;
  durationSec?: number;
  details: AnonymousQuizResultDetail[];
  savedAt: number;
};

function getAnonymousQuizResultSessionKey(token: string): string {
  return `anonymous-quiz-result:${token}`;
}

export function saveAnonymousQuizResultToSession(
  token: string,
  result: AnonymousQuizResultSession
): void {
  if (typeof window === "undefined") return;
  const key = getAnonymousQuizResultSessionKey(token);
  window.sessionStorage.setItem(key, JSON.stringify(result));
}

export function loadAnonymousQuizResultFromSession(
  token: string
): AnonymousQuizResultSession | null {
  if (typeof window === "undefined") return null;
  const key = getAnonymousQuizResultSessionKey(token);
  const raw = window.sessionStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AnonymousQuizResultSession;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !Array.isArray(parsed.details) ||
      typeof parsed.score !== "number" ||
      typeof parsed.totalQuestions !== "number" ||
      typeof parsed.correctAnswersCount !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearAnonymousQuizResultFromSession(token: string): void {
  if (typeof window === "undefined") return;
  const key = getAnonymousQuizResultSessionKey(token);
  window.sessionStorage.removeItem(key);
}
