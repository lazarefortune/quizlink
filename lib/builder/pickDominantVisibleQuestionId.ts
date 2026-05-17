/**
 * Picks the question id with the largest intersection ratio.
 * On ties, the earliest id in `orderedQuestionIds` wins (stable UX while scrolling).
 */
export function pickDominantVisibleQuestionId(
  intersectionRatios: ReadonlyMap<string, number>,
  orderedQuestionIds: readonly string[],
): string | null {
  let bestId: string | null = null;
  let bestRatio = 0;
  for (const id of orderedQuestionIds) {
    const ratio = intersectionRatios.get(id) ?? 0;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestId = id;
    }
  }
  if (bestId === null || bestRatio <= 0) {
    return null;
  }
  return bestId;
}
