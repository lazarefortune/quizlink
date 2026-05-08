export function buildQuizSuccessPath(quizId: string): string {
  return `/dashboard/quiz/${quizId}/success`;
}

export function shouldRedirectToQuizSuccess(input: {
  isExistingQuiz: boolean;
  quizId?: string | null;
}): boolean {
  return !input.isExistingQuiz && Boolean(input.quizId);
}
