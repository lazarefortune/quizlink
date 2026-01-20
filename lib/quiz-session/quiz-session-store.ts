import type { QuizSession } from "./quiz-session-types";

// In-memory store for quiz sessions
// In production, this would be replaced with Redis or a database
const quizSessions = new Map<string, QuizSession>();

// Clean up old sessions (older than 1 hour)
const SESSION_TTL = 60 * 60 * 1000; // 1 hour

function cleanupOldSessions() {
  const now = Date.now();
  for (const [sessionId, session] of quizSessions.entries()) {
    if (now - session.createdAt.getTime() > SESSION_TTL) {
      quizSessions.delete(sessionId);
    }
  }
}

// Run cleanup every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupOldSessions, 10 * 60 * 1000);
}

export function createQuizSession(session: QuizSession): void {
  quizSessions.set(session.id, session);
  cleanupOldSessions();
}

export function getQuizSession(sessionId: string): QuizSession | undefined {
  cleanupOldSessions();
  return quizSessions.get(sessionId);
}

export function updateQuizSession(sessionId: string, updates: Partial<QuizSession>): boolean {
  const session = quizSessions.get(sessionId);
  if (!session) {
    return false;
  }

  quizSessions.set(sessionId, { ...session, ...updates });
  return true;
}

export function deleteQuizSession(sessionId: string): boolean {
  return quizSessions.delete(sessionId);
}
