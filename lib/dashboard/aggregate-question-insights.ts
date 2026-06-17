export type QuestionInsightOption = {
  optionId: string;
  label: string;
  isCorrect: boolean;
  count: number;
  percentage: number;
};

export type QuestionInsight = {
  questionId: string;
  responseCount: number;
  successRate: number | null;
  averageTimeSeconds: number | null;
  expiredCount: number;
  optionDistribution: QuestionInsightOption[];
};

export type QuestionForInsights = {
  id: string;
  options: Array<{ id: string; label: string; isCorrect: boolean }>;
};

export type AnswerForInsights = {
  questionId: string;
  isCorrect: boolean;
  expired: boolean;
  timeSpent: number | null;
  selectedOptionIds: string[];
};

export function aggregateQuestionInsights(
  questions: QuestionForInsights[],
  answers: AnswerForInsights[],
): QuestionInsight[] {
  const answersByQuestion = new Map<string, AnswerForInsights[]>();

  for (const answer of answers) {
    const bucket = answersByQuestion.get(answer.questionId);
    if (bucket) {
      bucket.push(answer);
    } else {
      answersByQuestion.set(answer.questionId, [answer]);
    }
  }

  return questions.map((question) => {
    const questionAnswers = answersByQuestion.get(question.id) ?? [];
    const responseCount = questionAnswers.length;

    const correctCount = questionAnswers.filter((answer) => answer.isCorrect).length;
    const successRate =
      responseCount > 0 ? (correctCount / responseCount) * 100 : null;

    const timeValues = questionAnswers
      .map((answer) => answer.timeSpent)
      .filter((value): value is number => value != null && Number.isFinite(value));
    const averageTimeSeconds =
      timeValues.length > 0
        ? timeValues.reduce((sum, value) => sum + value, 0) / timeValues.length
        : null;

    const expiredCount = questionAnswers.filter((answer) => answer.expired).length;

    const optionCounts = new Map<string, number>();
    for (const answer of questionAnswers) {
      for (const optionId of answer.selectedOptionIds) {
        optionCounts.set(optionId, (optionCounts.get(optionId) ?? 0) + 1);
      }
    }

    const optionDistribution = question.options.map((option) => {
      const count = optionCounts.get(option.id) ?? 0;
      const percentage = responseCount > 0 ? (count / responseCount) * 100 : 0;
      return {
        optionId: option.id,
        label: option.label,
        isCorrect: option.isCorrect,
        count,
        percentage,
      };
    });

    return {
      questionId: question.id,
      responseCount,
      successRate,
      averageTimeSeconds,
      expiredCount,
      optionDistribution,
    };
  });
}
