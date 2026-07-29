import { describe, expect, it } from "vitest";

import {
  canProceedWithSplitSave,
  computeQuizBuilderMetadataSnapshot,
  computeQuizBuilderQuestionsSnapshot,
  mergeBaselineAfterPartialSave,
  resolveBuilderSplitSavePlan,
} from "@/lib/builder/builderSplitSave";
import type { QuizBuilder } from "@/types/quiz-builder";
import type { BuilderTimeLimitUi } from "@/lib/time-limit-seconds";

const timeLimitUi: BuilderTimeLimitUi = {
  enabled: false,
  minutes: 0,
  seconds: 0,
};

const baseQuiz = (): QuizBuilder => ({
  id: "quiz-1",
  name: "Mon quiz",
  visibility: "PRIVATE",
  settings: {
    showAnswerImmediately: true,
    randomizeQuestions: false,
    randomizeOptions: false,
    timeLimitPerQuestion: null,
  },
  questions: [
    {
      id: "q1",
      type: "MULTIPLE_CHOICE",
      label: "Question?",
      options: [
        { id: "o1", label: "A", isCorrect: true },
        { id: "o2", label: "B", isCorrect: false },
      ],
    },
  ],
  createdBy: "USER",
  createdAt: "2025-01-01T00:00:00.000Z",
});

function buildBaselineSnapshot(quiz: QuizBuilder): string {
  return JSON.stringify({
    id: quiz.id,
    name: quiz.name,
    visibility: quiz.visibility,
    settings: quiz.settings,
    timeLimitUi,
    questions: quiz.questions.map((question) => ({
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
    })),
  });
}

describe("resolveBuilderSplitSavePlan", () => {
  it("allows metadata-only save when questions are invalid", () => {
    const baselineQuiz = baseQuiz();
    const currentQuiz: QuizBuilder = {
      ...baselineQuiz,
      name: "Nouveau titre",
      questions: [
        {
          ...baselineQuiz.questions[0]!,
          label: "",
        },
      ],
    };
    const baselineSnapshot = buildBaselineSnapshot(baselineQuiz);
    const currentSnapshot = JSON.stringify({ marker: "changed" });

    const plan = resolveBuilderSplitSavePlan({
      quiz: currentQuiz,
      timeLimitUi,
      baselineSnapshot,
      currentSnapshot,
    });

    expect(plan.metadataDirty).toBe(true);
    expect(plan.questionsDirty).toBe(true);
    expect(plan.canSaveMetadata).toBe(true);
    expect(plan.canSaveQuestions).toBe(false);
    expect(canProceedWithSplitSave(plan)).toBe(true);
  });

  it("blocks save when metadata is dirty but invalid", () => {
    const baselineQuiz = baseQuiz();
    const currentQuiz = { ...baselineQuiz, name: "" };
    const plan = resolveBuilderSplitSavePlan({
      quiz: currentQuiz,
      timeLimitUi,
      baselineSnapshot: buildBaselineSnapshot(baselineQuiz),
      currentSnapshot: JSON.stringify({ marker: "changed" }),
    });

    expect(plan.canSaveMetadata).toBe(false);
    expect(plan.canSaveQuestions).toBe(false);
    expect(canProceedWithSplitSave(plan)).toBe(false);
  });
});

describe("mergeBaselineAfterPartialSave", () => {
  it("updates only metadata in the baseline after a metadata-only save", () => {
    const baselineQuiz = baseQuiz();
    const currentQuiz: QuizBuilder = {
      ...baselineQuiz,
      name: "Nouveau titre",
      questions: [
        {
          ...baselineQuiz.questions[0]!,
          label: "",
        },
      ],
    };
    const previousBaseline = buildBaselineSnapshot(baselineQuiz);

    const merged = mergeBaselineAfterPartialSave({
      previousBaselineSnapshot: previousBaseline,
      currentQuiz,
      currentTimeLimitUi: timeLimitUi,
      savedMetadata: true,
      savedQuestions: false,
    });

    const parsed = JSON.parse(merged) as {
      name: string;
      questions: Array<{ label: string }>;
    };
    expect(parsed.name).toBe("Nouveau titre");
    expect(parsed.questions[0]?.label).toBe("Question?");
  });

  it("updates only questions in the baseline after a questions-only save", () => {
    const baselineQuiz = baseQuiz();
    const currentQuiz: QuizBuilder = {
      ...baselineQuiz,
      name: "",
      questions: [
        {
          ...baselineQuiz.questions[0]!,
          label: "Question mise à jour",
        },
      ],
    };
    const previousBaseline = buildBaselineSnapshot(baselineQuiz);

    const merged = mergeBaselineAfterPartialSave({
      previousBaselineSnapshot: previousBaseline,
      currentQuiz,
      currentTimeLimitUi: timeLimitUi,
      savedMetadata: false,
      savedQuestions: true,
    });

    const parsed = JSON.parse(merged) as {
      name: string;
      questions: Array<{ label: string }>;
    };
    expect(parsed.name).toBe("Mon quiz");
    expect(parsed.questions[0]?.label).toBe("Question mise à jour");
  });
});

describe("computeQuizBuilderSnapshots", () => {
  it("detects metadata and question changes independently", () => {
    const quiz = baseQuiz();
    const metadataA = computeQuizBuilderMetadataSnapshot(quiz, timeLimitUi);
    const metadataB = computeQuizBuilderMetadataSnapshot({ ...quiz, name: "Autre" }, timeLimitUi);
    const questionsA = computeQuizBuilderQuestionsSnapshot(quiz);
    const questionsB = computeQuizBuilderQuestionsSnapshot({
      ...quiz,
      questions: [{ ...quiz.questions[0]!, label: "Changed" }],
    });

    expect(metadataA).not.toBe(metadataB);
    expect(questionsA).not.toBe(questionsB);
  });
});
