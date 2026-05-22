import {
  correctOptionIdsFromDbOptions,
  isSelectionCorrect,
} from "@/lib/anonymous-quiz-scoring";
import { getQuestionImageSrc } from "@/lib/question-image-src";

export type QuizPreviewQuestion = {
  id: string;
  type: string;
  label: string;
  image: string | null;
  imageKey: string | null;
  explanation: string | null;
  order: number;
  options: Array<{ id: string; label: string; isCorrect: boolean }>;
};

export type QuizPreviewAnswerInput = {
  questionId: string;
  selectedOptionIds: string[];
};

export type QuizPreviewDetailRow = {
  questionId: string;
  questionLabel: string;
  questionImage: string | null;
  selectedOptionIds: string[];
  selectedOptionLabels: string[];
  correctOptionIds: string[];
  correctOptionLabels: string[];
  isCorrect: boolean;
  explanation: string | null;
};

export function gradeQuizPreviewAnswer(
  question: QuizPreviewQuestion,
  selectedOptionIds: string[],
  showAnswerImmediately: boolean,
): { isCorrect: boolean; correctOptionIds?: string[] } {
  const isCorrect = isSelectionCorrect(selectedOptionIds, question.options);
  return {
    isCorrect,
    correctOptionIds: showAnswerImmediately
      ? correctOptionIdsFromDbOptions(question.options)
      : undefined,
  };
}

export function computeQuizPreviewFinishResult(
  questions: QuizPreviewQuestion[],
  answers: QuizPreviewAnswerInput[],
  settings: { showAnswersAtEnd: boolean },
): {
  score: number;
  totalQuestions: number;
  correctAnswersCount: number;
  showAnswersAtEnd: boolean;
  details: QuizPreviewDetailRow[];
} {
  const totalQuestions = questions.length;
  const answersByQuestionId = new Map(
    answers.map((answer) => [answer.questionId, answer.selectedOptionIds]),
  );

  const details: QuizPreviewDetailRow[] = questions.map((question) => {
    const selectedOptionIds = answersByQuestionId.get(question.id) ?? [];
    const isCorrect = isSelectionCorrect(selectedOptionIds, question.options);
    const correctOptionIds = correctOptionIdsFromDbOptions(question.options);
    const optionLabelById = new Map(
      question.options.map((option) => [option.id, option.label]),
    );

    return {
      questionId: question.id,
      questionLabel: question.label,
      questionImage: getQuestionImageSrc({
        image: question.image,
        imageKey: question.imageKey,
      }),
      selectedOptionIds,
      selectedOptionLabels: selectedOptionIds.map(
        (id) => optionLabelById.get(id) ?? id,
      ),
      correctOptionIds,
      correctOptionLabels: correctOptionIds.map(
        (id) => optionLabelById.get(id) ?? id,
      ),
      isCorrect,
      explanation: question.explanation,
    };
  });

  const correctAnswersCount = details.filter((row) => row.isCorrect).length;
  const score =
    totalQuestions > 0 ? (correctAnswersCount / totalQuestions) * 100 : 0;

  return {
    score,
    totalQuestions,
    correctAnswersCount,
    showAnswersAtEnd: settings.showAnswersAtEnd,
    details,
  };
}
