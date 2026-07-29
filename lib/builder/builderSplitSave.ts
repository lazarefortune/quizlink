import {
  resolvePersistedTimeLimit,
  type BuilderTimeLimitUi,
} from "@/lib/time-limit-seconds";
import {
  validateQuizMetadata,
  validateQuizQuestions,
  type ValidationError,
} from "@/lib/quiz-validation";
import type { Question, QuizBuilder } from "@/types/quiz-builder";

type SnapshotQuestion = {
  id: string;
  type: string;
  label: string;
  explanation: string;
  image: string;
  imageKey: string;
  options: Array<{ id: string; label: string; isCorrect: boolean }>;
};

type ParsedBuilderSnapshot = {
  name: string;
  visibility: string;
  settings: QuizBuilder["settings"];
  timeLimitUi: BuilderTimeLimitUi;
  questions: SnapshotQuestion[];
};

export type BuilderSplitSavePlan = {
  metadataDirty: boolean;
  questionsDirty: boolean;
  metadataErrors: ValidationError[];
  questionErrors: ValidationError[];
  canSaveMetadata: boolean;
  canSaveQuestions: boolean;
};

function serializeSnapshotQuestion(question: Question): SnapshotQuestion {
  return {
    id: question.id,
    type: question.type,
    label: question.label,
    explanation: question.explanation ?? "",
    image: question.image ?? "",
    imageKey: question.imageKey ?? "",
    options: question.options.map((option) => ({
      id: option.id,
      label: option.label,
      isCorrect: option.isCorrect,
    })),
  };
}

export function computeQuizBuilderMetadataSnapshot(
  quiz: QuizBuilder,
  timeLimitUi: BuilderTimeLimitUi,
): string {
  return JSON.stringify({
    name: quiz.name,
    visibility: quiz.visibility,
    settings: {
      ...quiz.settings,
      timeLimitPerQuestion: resolvePersistedTimeLimit(quiz.settings, timeLimitUi),
    },
    timeLimitUi,
  });
}

export function computeQuizBuilderQuestionsSnapshot(quiz: Pick<QuizBuilder, "questions">): string {
  return JSON.stringify({
    questions: quiz.questions.map(serializeSnapshotQuestion),
  });
}

function parseBuilderSnapshot(snapshot: string): ParsedBuilderSnapshot | null {
  try {
    const parsed = JSON.parse(snapshot) as Partial<ParsedBuilderSnapshot>;
    if (
      typeof parsed.name !== "string" ||
      typeof parsed.visibility !== "string" ||
      !parsed.settings ||
      !parsed.timeLimitUi ||
      !Array.isArray(parsed.questions)
    ) {
      return null;
    }
    return parsed as ParsedBuilderSnapshot;
  } catch {
    return null;
  }
}

export function resolveBuilderSplitSavePlan(input: {
  quiz: QuizBuilder;
  timeLimitUi: BuilderTimeLimitUi;
  baselineSnapshot: string | null;
  currentSnapshot: string;
}): BuilderSplitSavePlan {
  const currentMetadataSnapshot = computeQuizBuilderMetadataSnapshot(input.quiz, input.timeLimitUi);
  const currentQuestionsSnapshot = computeQuizBuilderQuestionsSnapshot(input.quiz);

  const baseline = input.baselineSnapshot ? parseBuilderSnapshot(input.baselineSnapshot) : null;
  const baselineMetadataSnapshot = baseline
    ? JSON.stringify({
        name: baseline.name,
        visibility: baseline.visibility,
        settings: baseline.settings,
        timeLimitUi: baseline.timeLimitUi,
      })
    : null;
  const baselineQuestionsSnapshot = baseline
    ? JSON.stringify({ questions: baseline.questions })
    : null;

  const metadataDirty =
    baselineMetadataSnapshot === null
      ? true
      : baselineMetadataSnapshot !== currentMetadataSnapshot;
  const questionsDirty =
    baselineQuestionsSnapshot === null
      ? input.quiz.questions.length > 0
      : baselineQuestionsSnapshot !== currentQuestionsSnapshot;

  const metadataErrors = validateQuizMetadata(input.quiz, input.timeLimitUi);
  const questionErrors = validateQuizQuestions(input.quiz);

  const canSaveMetadata = metadataDirty && metadataErrors.length === 0;
  const canSaveQuestions = questionsDirty && questionErrors.length === 0;

  return {
    metadataDirty,
    questionsDirty,
    metadataErrors,
    questionErrors,
    canSaveMetadata,
    canSaveQuestions,
  };
}

export function canProceedWithSplitSave(plan: BuilderSplitSavePlan): boolean {
  return plan.canSaveMetadata || plan.canSaveQuestions;
}

export function collectBuilderMetadataValidationErrors(
  quiz: Pick<QuizBuilder, "name">,
  timeLimitUi: BuilderTimeLimitUi,
): ValidationError[] {
  return validateQuizMetadata(quiz, timeLimitUi);
}

export function collectBuilderQuestionsValidationErrors(
  quiz: Pick<QuizBuilder, "questions">,
): ValidationError[] {
  return validateQuizQuestions(quiz);
}

export function collectBuilderFullSaveValidationErrors(
  quiz: QuizBuilder,
  timeLimitUi: BuilderTimeLimitUi,
): ValidationError[] {
  return [...validateQuizMetadata(quiz, timeLimitUi), ...validateQuizQuestions(quiz)];
}

export function canProceedWithBuilderSave(input: {
  quiz: QuizBuilder;
  timeLimitUi: BuilderTimeLimitUi;
  baselineSnapshot: string | null;
  currentSnapshot: string;
}): boolean {
  return canProceedWithSplitSave(
    resolveBuilderSplitSavePlan({
      quiz: input.quiz,
      timeLimitUi: input.timeLimitUi,
      baselineSnapshot: input.baselineSnapshot,
      currentSnapshot: input.currentSnapshot,
    }),
  );
}

export function mergeBaselineAfterPartialSave(input: {
  previousBaselineSnapshot: string;
  currentQuiz: QuizBuilder;
  currentTimeLimitUi: BuilderTimeLimitUi;
  savedMetadata: boolean;
  savedQuestions: boolean;
}): string {
  const previous = parseBuilderSnapshot(input.previousBaselineSnapshot);
  if (!previous) {
    return computeQuizBuilderMetadataSnapshot(input.currentQuiz, input.currentTimeLimitUi);
  }

  const metadata = input.savedMetadata
    ? {
        name: input.currentQuiz.name,
        visibility: input.currentQuiz.visibility,
        settings: {
          ...input.currentQuiz.settings,
          timeLimitPerQuestion: resolvePersistedTimeLimit(
            input.currentQuiz.settings,
            input.currentTimeLimitUi,
          ),
        },
        timeLimitUi: input.currentTimeLimitUi,
      }
    : {
        name: previous.name,
        visibility: previous.visibility,
        settings: previous.settings,
        timeLimitUi: previous.timeLimitUi,
      };

  const questions = input.savedQuestions
    ? input.currentQuiz.questions.map(serializeSnapshotQuestion)
    : previous.questions;

  return JSON.stringify({
    id: input.currentQuiz.id,
    ...metadata,
    questions,
  });
}

export function questionsSnapshotsEqual(
  left: Pick<QuizBuilder, "questions">,
  right: Pick<QuizBuilder, "questions">,
): boolean {
  return computeQuizBuilderQuestionsSnapshot(left) === computeQuizBuilderQuestionsSnapshot(right);
}
