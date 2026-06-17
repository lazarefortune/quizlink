import { cookies } from "next/headers";

import {
  buildQuizAttemptCookieName,
  buildQuizAttemptCookieOptions,
} from "@/lib/quiz/quiz-attempt-cookie";

export async function setAnonymousQuizAttemptCookie(
  token: string,
  attemptId: string,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    buildQuizAttemptCookieName(token),
    attemptId,
    buildQuizAttemptCookieOptions(token),
  );
}

export async function getAnonymousQuizAttemptCookie(
  token: string,
): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(buildQuizAttemptCookieName(token))?.value;
  return value?.trim() ? value.trim() : null;
}

export async function clearAnonymousQuizAttemptCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete({
    name: buildQuizAttemptCookieName(token),
    path: buildQuizAttemptCookieOptions(token).path,
  });
}
