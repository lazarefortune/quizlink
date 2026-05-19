import { describe, expect, it } from "vitest";

import {
  buildBuilderQuestionErrorIdSet,
  countBuilderValidationProblemAreas,
  findFirstBuilderValidationErrorTarget,
} from "./builderValidationTarget";
import type { ValidationError } from "@/lib/quiz-validation";
import type { Question } from "@/types/quiz-builder";

function makeQuestion(id: string): Question {
  return {
    id,
    type: "MULTIPLE_CHOICE",
    label: "",
    options: [
      { id: `${id}-o1`, label: "", isCorrect: false },
      { id: `${id}-o2`, label: "", isCorrect: false },
    ],
  };
}

const questions: Question[] = [
  makeQuestion("q-a"),
  makeQuestion("q-b"),
  makeQuestion("q-c"),
];

describe("findFirstBuilderValidationErrorTarget", () => {
  it("returns null when there are no errors", () => {
    expect(findFirstBuilderValidationErrorTarget([], questions)).toBeNull();
  });

  it("prioritises the quiz name error over everything else", () => {
    const errors: ValidationError[] = [
      { field: "questions[0].label", translationKey: "k" },
      { field: "settings.timeLimitPerQuestion", translationKey: "k" },
      { field: "name", translationKey: "k" },
    ];
    expect(findFirstBuilderValidationErrorTarget(errors, questions)).toEqual({
      type: "quiz-name",
    });
  });

  it("returns quiz-settings when name is fine but settings have an error", () => {
    const errors: ValidationError[] = [
      { field: "questions[1].label", translationKey: "k" },
      { field: "settings.timeLimitPerQuestion", translationKey: "k" },
    ];
    expect(findFirstBuilderValidationErrorTarget(errors, questions)).toEqual({
      type: "quiz-settings",
    });
  });

  it("returns the first question (by index) when only question errors are present", () => {
    const errors: ValidationError[] = [
      { field: "questions[2].correctAnswer", translationKey: "k" },
      { field: "questions[1].label", translationKey: "k" },
    ];
    expect(findFirstBuilderValidationErrorTarget(errors, questions)).toEqual({
      type: "question",
      questionId: "q-b",
      questionIndex: 1,
    });
  });

  it("ignores question errors whose index is out of range", () => {
    const errors: ValidationError[] = [
      { field: "questions[42].label", translationKey: "k" },
    ];
    expect(findFirstBuilderValidationErrorTarget(errors, questions)).toBeNull();
  });

  it("ignores unknown error shapes and returns null when nothing matches", () => {
    const errors: ValidationError[] = [
      { field: "unknown.foo", translationKey: "k" },
    ];
    expect(findFirstBuilderValidationErrorTarget(errors, questions)).toBeNull();
  });
});

describe("buildBuilderQuestionErrorIdSet", () => {
  it("returns an empty set when there are no errors", () => {
    expect(buildBuilderQuestionErrorIdSet([], questions).size).toBe(0);
  });

  it("collects unique question ids across multiple errors", () => {
    const errors: ValidationError[] = [
      { field: "questions[0].label", translationKey: "k" },
      { field: "questions[0].correctAnswer", translationKey: "k" },
      { field: "questions[2].options[0].label", translationKey: "k" },
      { field: "name", translationKey: "k" },
      { field: "settings.timeLimitPerQuestion", translationKey: "k" },
    ];
    const ids = buildBuilderQuestionErrorIdSet(errors, questions);
    expect(ids.size).toBe(2);
    expect(ids.has("q-a")).toBe(true);
    expect(ids.has("q-c")).toBe(true);
    expect(ids.has("q-b")).toBe(false);
  });

  it("skips errors whose index has no matching question", () => {
    const errors: ValidationError[] = [
      { field: "questions[99].label", translationKey: "k" },
    ];
    expect(buildBuilderQuestionErrorIdSet(errors, questions).size).toBe(0);
  });
});

describe("countBuilderValidationProblemAreas", () => {
  it("returns 0 when there are no errors", () => {
    expect(countBuilderValidationProblemAreas([], questions)).toBe(0);
  });

  it("counts one zone per question even when a question has several errors", () => {
    const errors: ValidationError[] = [
      { field: "questions[0].label", translationKey: "k" },
      { field: "questions[0].correctAnswer", translationKey: "k" },
      { field: "questions[0].options[0].label", translationKey: "k" },
    ];
    expect(countBuilderValidationProblemAreas(errors, questions)).toBe(1);
  });

  it("counts the name field as one zone independent of question errors", () => {
    const errors: ValidationError[] = [
      { field: "name", translationKey: "k" },
      { field: "questions[1].label", translationKey: "k" },
    ];
    expect(countBuilderValidationProblemAreas(errors, questions)).toBe(2);
  });

  it("counts the settings panel as a single zone regardless of how many settings errors", () => {
    const errors: ValidationError[] = [
      { field: "settings.timeLimitPerQuestion", translationKey: "k" },
      { field: "settings.randomizeOptions", translationKey: "k" },
    ];
    expect(countBuilderValidationProblemAreas(errors, questions)).toBe(1);
  });

  it("sums name, settings and each affected question", () => {
    const errors: ValidationError[] = [
      { field: "name", translationKey: "k" },
      { field: "settings.timeLimitPerQuestion", translationKey: "k" },
      { field: "questions[0].label", translationKey: "k" },
      { field: "questions[0].correctAnswer", translationKey: "k" },
      { field: "questions[2].options[0].label", translationKey: "k" },
    ];
    expect(countBuilderValidationProblemAreas(errors, questions)).toBe(4);
  });
});
