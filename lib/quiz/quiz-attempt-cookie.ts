import { createHash } from "node:crypto";

/** Short-lived session for an anonymous play attempt (seconds). */
export const QUIZ_ATTEMPT_COOKIE_MAX_AGE_SECONDS = 2 * 60 * 60;

const COOKIE_PREFIX = "quizlink_attempt_";

/**
 * Stable cookie name per public quiz link token (token is already public in the URL).
 */
export function buildQuizAttemptCookieName(token: string): string {
  const trimmed = (token ?? "").trim();
  if (trimmed.length <= 64 && /^[\w-]+$/.test(trimmed)) {
    return `${COOKIE_PREFIX}${trimmed}`;
  }
  const digest = createHash("sha256").update(trimmed).digest("hex").slice(0, 32);
  return `${COOKIE_PREFIX}${digest}`;
}

export function buildQuizAttemptCookiePath(token: string): string {
  const trimmed = (token ?? "").trim();
  return `/quiz/${encodeURIComponent(trimmed)}`;
}

export type QuizAttemptCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
};

export function buildQuizAttemptCookieOptions(token: string): QuizAttemptCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: buildQuizAttemptCookiePath(token),
    maxAge: QUIZ_ATTEMPT_COOKIE_MAX_AGE_SECONDS,
  };
}
