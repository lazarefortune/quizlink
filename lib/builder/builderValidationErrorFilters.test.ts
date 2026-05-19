import { describe, expect, it } from "vitest";

import {
  reindexValidationErrorsForQuestions,
  removeValidationErrorsAfterQuestionChange,
  removeValidationErrorsForField,
  removeValidationErrorsForFieldPrefix,
  removeValidationErrorsForOption,
  removeValidationErrorsForQuestionId,
  removeValidationErrorsForQuestionIndex,
} from "./builderValidationErrorFilters";
import { buildBuilderQuestionErrorIdSet } from "./builderValidationTarget";
import type { ValidationError } from "@/lib/quiz-validation";
import type { Question } from "@/types/quiz-builder";

function makeQuestion(
  id: string,
  overrides: Partial<Question> = {},
): Question {
  return {
    id,
    type: "MULTIPLE_CHOICE",
    label: "",
    options: [
      { id: `${id}-o1`, label: "", isCorrect: false },
      { id: `${id}-o2`, label: "", isCorrect: false },
    ],
    ...overrides,
  };
}

function err(field: string): ValidationError {
  return { field, translationKey: "k" };
}

describe("removeValidationErrorsForField", () => {
  it("removes only the exact field, keeps everything else", () => {
    const input = [err("name"), err("settings.timeLimitPerQuestion"), err("questions[0].label")];
    const result = removeValidationErrorsForField(input, "name");
    expect(result).toEqual([
      err("settings.timeLimitPerQuestion"),
      err("questions[0].label"),
    ]);
  });

  it("returns same array when the field is not present", () => {
    const input = [err("questions[1].label")];
    expect(removeValidationErrorsForField(input, "name")).toEqual(input);
  });
});

describe("removeValidationErrorsForFieldPrefix", () => {
  it("removes only errors starting with the given prefix", () => {
    const input = [
      err("settings.timeLimitPerQuestion"),
      err("settings.randomizeQuestions"),
      err("name"),
      err("questions[0].label"),
    ];
    expect(removeValidationErrorsForFieldPrefix(input, "settings.")).toEqual([
      err("name"),
      err("questions[0].label"),
    ]);
  });
});

describe("removeValidationErrorsForQuestionIndex", () => {
  it("removes only errors for the matching question index", () => {
    const input = [
      err("questions[0].label"),
      err("questions[0].options[0].label"),
      err("questions[1].label"),
      err("name"),
    ];
    expect(removeValidationErrorsForQuestionIndex(input, 0)).toEqual([
      err("questions[1].label"),
      err("name"),
    ]);
  });

  it("does not match a different index that starts with the same digit", () => {
    const input = [
      err("questions[1].label"),
      err("questions[10].label"),
    ];
    expect(removeValidationErrorsForQuestionIndex(input, 1)).toEqual([
      err("questions[10].label"),
    ]);
  });
});

describe("removeValidationErrorsForQuestionId", () => {
  const questions = [makeQuestion("q-a"), makeQuestion("q-b"), makeQuestion("q-c")];

  it("removes errors of the question matching the given id", () => {
    const input = [
      err("questions[0].label"),
      err("questions[1].label"),
      err("questions[2].label"),
    ];
    expect(removeValidationErrorsForQuestionId(input, questions, "q-b")).toEqual([
      err("questions[0].label"),
      err("questions[2].label"),
    ]);
  });

  it("returns the input unchanged when the id is unknown", () => {
    const input = [err("questions[0].label"), err("name")];
    expect(removeValidationErrorsForQuestionId(input, questions, "missing")).toBe(
      input,
    );
  });
});

describe("removeValidationErrorsForOption", () => {
  it("removes only errors of the targeted option", () => {
    const input = [
      err("questions[0].options[0].label"),
      err("questions[0].options[1].label"),
      err("questions[0].correctAnswer"),
    ];
    expect(removeValidationErrorsForOption(input, 0, 1)).toEqual([
      err("questions[0].options[0].label"),
      err("questions[0].correctAnswer"),
    ]);
  });
});

describe("removeValidationErrorsAfterQuestionChange", () => {
  const baseOptions = [
    { id: "o1", label: "", isCorrect: false },
    { id: "o2", label: "", isCorrect: false },
  ];

  it("only drops the label error when only the label changes", () => {
    const previous = makeQuestion("q-1", { label: "" });
    const next = makeQuestion("q-1", { label: "What is 1+1?" });
    const input = [
      err("questions[0].label"),
      err("questions[0].correctAnswer"),
      err("questions[1].label"),
    ];
    expect(
      removeValidationErrorsAfterQuestionChange(input, 0, previous, next),
    ).toEqual([err("questions[0].correctAnswer"), err("questions[1].label")]);
  });

  it("drops correctAnswer error when an option's isCorrect changes", () => {
    const previous = makeQuestion("q-1", { options: baseOptions });
    const next = makeQuestion("q-1", {
      options: [
        { ...baseOptions[0]!, isCorrect: true },
        baseOptions[1]!,
      ],
    });
    const input = [
      err("questions[0].correctAnswer"),
      err("questions[0].label"),
    ];
    expect(
      removeValidationErrorsAfterQuestionChange(input, 0, previous, next),
    ).toEqual([err("questions[0].label")]);
  });

  it("drops only the changed option label error", () => {
    const previous = makeQuestion("q-1", { options: baseOptions });
    const next = makeQuestion("q-1", {
      options: [
        { ...baseOptions[0]!, label: "Paris" },
        baseOptions[1]!,
      ],
    });
    const input = [
      err("questions[0].options[0].label"),
      err("questions[0].options[1].label"),
    ];
    expect(
      removeValidationErrorsAfterQuestionChange(input, 0, previous, next),
    ).toEqual([err("questions[0].options[1].label")]);
  });

  it("drops all option-related errors when option count changes", () => {
    const previous = makeQuestion("q-1", { options: baseOptions });
    const next = makeQuestion("q-1", {
      options: [...baseOptions, { id: "o3", label: "", isCorrect: false }],
    });
    const input = [
      err("questions[0].options"),
      err("questions[0].options[0].label"),
      err("questions[0].correctAnswer"),
      err("questions[0].label"),
      err("questions[1].label"),
    ];
    expect(
      removeValidationErrorsAfterQuestionChange(input, 0, previous, next),
    ).toEqual([err("questions[0].label"), err("questions[1].label")]);
  });

  it("drops every error of this question when the type changes", () => {
    const previous = makeQuestion("q-1", { type: "MULTIPLE_CHOICE" });
    const next = makeQuestion("q-1", { type: "TRUE_FALSE" });
    const input = [
      err("questions[0].label"),
      err("questions[0].correctAnswer"),
      err("questions[0].options"),
      err("questions[1].label"),
    ];
    expect(
      removeValidationErrorsAfterQuestionChange(input, 0, previous, next),
    ).toEqual([err("questions[1].label")]);
  });

  it("never removes errors belonging to a different question", () => {
    const previous = makeQuestion("q-1", { label: "" });
    const next = makeQuestion("q-1", { label: "edited" });
    const input = [
      err("questions[0].label"),
      err("questions[1].label"),
      err("questions[1].correctAnswer"),
      err("name"),
      err("settings.timeLimitPerQuestion"),
    ];
    expect(
      removeValidationErrorsAfterQuestionChange(input, 0, previous, next),
    ).toEqual([
      err("questions[1].label"),
      err("questions[1].correctAnswer"),
      err("name"),
      err("settings.timeLimitPerQuestion"),
    ]);
  });
});

describe("reindexValidationErrorsForQuestions", () => {
  it("drops errors of a deleted question and shifts later indexes down", () => {
    const prev = [makeQuestion("q-a"), makeQuestion("q-b"), makeQuestion("q-c")];
    const next = [makeQuestion("q-a"), makeQuestion("q-c")];
    const input = [
      err("questions[0].label"),
      err("questions[1].label"),
      err("questions[2].options[0].label"),
      err("name"),
    ];
    expect(reindexValidationErrorsForQuestions(input, prev, next)).toEqual([
      err("questions[0].label"),
      err("questions[1].options[0].label"),
      err("name"),
    ]);
  });

  it("re-indexes when questions are swapped (move)", () => {
    const prev = [makeQuestion("q-a"), makeQuestion("q-b"), makeQuestion("q-c")];
    const next = [makeQuestion("q-b"), makeQuestion("q-a"), makeQuestion("q-c")];
    const input = [
      err("questions[0].label"),
      err("questions[1].correctAnswer"),
    ];
    expect(reindexValidationErrorsForQuestions(input, prev, next)).toEqual([
      err("questions[1].label"),
      err("questions[0].correctAnswer"),
    ]);
  });

  it("keeps non-question errors untouched", () => {
    const prev = [makeQuestion("q-a")];
    const next = [makeQuestion("q-a")];
    const input = [err("name"), err("settings.timeLimitPerQuestion")];
    expect(reindexValidationErrorsForQuestions(input, prev, next)).toEqual(input);
  });
});

describe("integration with buildBuilderQuestionErrorIdSet", () => {
  it("keeps other questions flagged after one question's errors are cleared", () => {
    const questions = [makeQuestion("q-a"), makeQuestion("q-b")];
    const input = [
      err("questions[0].label"),
      err("questions[1].label"),
    ];
    const filtered = removeValidationErrorsForQuestionIndex(input, 0);
    const ids = buildBuilderQuestionErrorIdSet(filtered, questions);
    expect(ids.has("q-a")).toBe(false);
    expect(ids.has("q-b")).toBe(true);
  });
});
