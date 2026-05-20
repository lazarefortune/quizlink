export type QuestionTimerDeadline = {
  startedAt: number;
  deadlineAt: number;
};

export function createQuestionTimerDeadline(
  totalSeconds: number,
  now: number = Date.now(),
): QuestionTimerDeadline | null {
  if (totalSeconds <= 0) {
    return null;
  }

  const startedAt = now;
  return {
    startedAt,
    deadlineAt: startedAt + totalSeconds * 1000,
  };
}

export function getRemainingSecondsFromDeadline(
  deadlineAt: number,
  now: number = Date.now(),
): number {
  const remainingMs = deadlineAt - now;
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

export function isQuestionTimerExpired(
  deadlineAt: number,
  now: number = Date.now(),
): boolean {
  return now >= deadlineAt;
}
