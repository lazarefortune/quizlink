export type QuizPlayShuffleSettings = {
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
};

function shuffleInPlace<T>(items: T[], randomFn: () => number): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomFn() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/**
 * Applies the same question/option shuffle rules as live play (deterministic when randomFn is fixed).
 */
export function applyQuizPlayShuffle<T extends { options: unknown[] }>(
  questions: readonly T[],
  shuffle: QuizPlayShuffleSettings,
  randomFn: () => number = Math.random,
): T[] {
  let result = [...questions];

  if (shuffle.randomizeQuestions) {
    result = shuffleInPlace(result, randomFn);
  }

  if (shuffle.randomizeOptions) {
    result = result.map((question) => ({
      ...question,
      options: shuffleInPlace([...question.options], randomFn),
    }));
  }

  return result;
}
