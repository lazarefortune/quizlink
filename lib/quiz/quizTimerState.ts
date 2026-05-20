export type QuizTimerState = "normal" | "warning" | "danger";

export type QuizTimerInfo = {
  percent: number;
  state: QuizTimerState;
};

export function resolveQuizTimerInfo(
  timeLeftSeconds: number | null | undefined,
  totalSeconds: number | null | undefined,
): QuizTimerInfo | null {
  if (
    timeLeftSeconds === null ||
    timeLeftSeconds === undefined ||
    totalSeconds === null ||
    totalSeconds === undefined ||
    totalSeconds <= 0
  ) {
    return null;
  }

  const ratio = timeLeftSeconds / totalSeconds;
  const percent = Math.max(0, Math.min(100, ratio * 100));

  let state: QuizTimerState;
  if (percent <= 20) {
    state = "danger";
  } else if (percent <= 50) {
    state = "warning";
  } else {
    state = "normal";
  }

  return { percent, state };
}
