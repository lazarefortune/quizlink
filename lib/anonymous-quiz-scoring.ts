/**
 * Pure scoring helpers for anonymous quiz validation (no DB).
 */

export function correctOptionIdsFromDbOptions(
  options: Array<{ id: string; isCorrect: boolean }>
): string[] {
  return options.filter((o) => o.isCorrect).map((o) => o.id);
}

export function isSelectionCorrect(
  selectedOptionIds: string[],
  options: Array<{ id: string; isCorrect: boolean }>
): boolean {
  const correctIds = correctOptionIdsFromDbOptions(options);
  const userSet = new Set(selectedOptionIds);
  const correctSet = new Set(correctIds);
  return (
    userSet.size === correctSet.size &&
    [...userSet].every((id) => correctSet.has(id))
  );
}
