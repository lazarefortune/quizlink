export type HistoricalAttemptInput = {
  id: string;
  status: string;
  score: number | null;
  totalQuestions: number | null;
  durationSeconds: number | null;
  /** Fallback when `totalQuestions` is missing on older completed attempts. */
  answerCount?: number;
};

export type HistoricalAnswerInput = {
  questionId: string;
  isCorrect: boolean;
  expired: boolean;
  timeSpentSeconds: number | null;
};

export type BuiltQuizResponseStats = {
  quizId: string;
  totalStarted: number;
  totalCompleted: number;
  totalAbandoned: number;
  totalScore: number;
  totalPossibleScore: number;
  totalDurationSeconds: number;
  completedDurationCount: number;
};

export type BuiltQuizQuestionResponseStats = {
  quizId: string;
  questionId: string;
  totalAnswers: number;
  correctAnswers: number;
  expiredAnswers: number;
  totalTimeSpentSeconds: number;
  timeSpentCount: number;
};

export type BuiltQuizAggregatesFromHistory = {
  quizId: string;
  responseStats: BuiltQuizResponseStats | null;
  questionStats: BuiltQuizQuestionResponseStats[];
};

/**
 * Matches live increment logic in `incrementQuizCompletedAggregate`.
 */
export function resolveCompletedAttemptTotalQuestions(
  attempt: Pick<HistoricalAttemptInput, "totalQuestions">,
  answerCount: number,
): number {
  if (attempt.totalQuestions != null && attempt.totalQuestions > 0) {
    return attempt.totalQuestions;
  }

  if (answerCount > 0) {
    return answerCount;
  }

  return 0;
}

export function computeCorrectAnswersFromScore(
  score: number,
  totalQuestions: number,
): number {
  if (totalQuestions <= 0) {
    return 0;
  }

  return (score / 100) * totalQuestions;
}

export function buildQuizResponseStatsFromHistory(
  quizId: string,
  attempts: HistoricalAttemptInput[],
): BuiltQuizResponseStats | null {
  if (attempts.length === 0) {
    return null;
  }

  let totalCompleted = 0;
  let totalAbandoned = 0;
  let totalScore = 0;
  let totalPossibleScore = 0;
  let totalDurationSeconds = 0;
  let completedDurationCount = 0;

  for (const attempt of attempts) {
    if (attempt.status === "COMPLETED") {
      totalCompleted += 1;

      if (attempt.score != null && Number.isFinite(attempt.score)) {
        const resolvedTotalQuestions = resolveCompletedAttemptTotalQuestions(
          attempt,
          attempt.answerCount ?? 0,
        );
        totalScore += computeCorrectAnswersFromScore(
          attempt.score,
          resolvedTotalQuestions,
        );
        totalPossibleScore += resolvedTotalQuestions;
      }

      if (attempt.durationSeconds != null && Number.isFinite(attempt.durationSeconds)) {
        totalDurationSeconds += attempt.durationSeconds;
        completedDurationCount += 1;
      }
      continue;
    }

    if (attempt.status === "ABANDONED") {
      totalAbandoned += 1;
    }
  }

  return {
    quizId,
    totalStarted: attempts.length,
    totalCompleted,
    totalAbandoned,
    totalScore,
    totalPossibleScore,
    totalDurationSeconds,
    completedDurationCount,
  };
}

export function buildQuestionResponseStatsFromHistory(
  quizId: string,
  answers: HistoricalAnswerInput[],
): BuiltQuizQuestionResponseStats[] {
  const byQuestionId = new Map<string, BuiltQuizQuestionResponseStats>();

  for (const answer of answers) {
    const existing = byQuestionId.get(answer.questionId) ?? {
      quizId,
      questionId: answer.questionId,
      totalAnswers: 0,
      correctAnswers: 0,
      expiredAnswers: 0,
      totalTimeSpentSeconds: 0,
      timeSpentCount: 0,
    };

    existing.totalAnswers += 1;
    if (answer.isCorrect) {
      existing.correctAnswers += 1;
    }
    if (answer.expired) {
      existing.expiredAnswers += 1;
    }
    if (answer.timeSpentSeconds != null && Number.isFinite(answer.timeSpentSeconds)) {
      existing.totalTimeSpentSeconds += answer.timeSpentSeconds;
      existing.timeSpentCount += 1;
    }

    byQuestionId.set(answer.questionId, existing);
  }

  return [...byQuestionId.values()].sort((left, right) =>
    left.questionId.localeCompare(right.questionId),
  );
}

export function buildQuizAggregatesFromHistory(params: {
  quizId: string;
  attempts: HistoricalAttemptInput[];
  answersFromCompletedAttempts: HistoricalAnswerInput[];
}): BuiltQuizAggregatesFromHistory {
  return {
    quizId: params.quizId,
    responseStats: buildQuizResponseStatsFromHistory(params.quizId, params.attempts),
    questionStats: buildQuestionResponseStatsFromHistory(
      params.quizId,
      params.answersFromCompletedAttempts,
    ),
  };
}
