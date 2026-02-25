/**
 * Format score for display: "correct / total" (e.g. "8 / 10").
 * When only percentage is available and totalQuestions is known, derives correct from score.
 */
export function formatScoreFraction(
  scorePercent: number | null,
  totalQuestions: number
): string {
  if (scorePercent == null || totalQuestions <= 0) return "-";
  const correct = Math.round((scorePercent / 100) * totalQuestions);
  return `${correct} / ${totalQuestions}`;
}

/**
 * Format score as "correct / total (percent%)" for display when both fraction and % are useful.
 */
export function formatScoreWithPercent(
  scorePercent: number | null,
  totalQuestions: number
): string {
  if (scorePercent == null || totalQuestions <= 0) return "-";
  const correct = Math.round((scorePercent / 100) * totalQuestions);
  return `${correct} / ${totalQuestions} (${scorePercent.toFixed(0)}%)`;
}
