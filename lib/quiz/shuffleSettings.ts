export type ShuffleSettingsInput = {
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
};

/**
 * Resolves persisted JSON settings into effective shuffle flags.
 * Legacy quizzes: when `randomizeOptions` is absent, it follows `randomizeQuestions`.
 */
export function resolveEffectiveShuffleSettings(
  input: ShuffleSettingsInput,
): { randomizeQuestions: boolean; randomizeOptions: boolean } {
  const randomizeQuestions = Boolean(input.randomizeQuestions);
  const randomizeOptions =
    input.randomizeOptions !== undefined
      ? Boolean(input.randomizeOptions)
      : randomizeQuestions;
  return { randomizeQuestions, randomizeOptions };
}
