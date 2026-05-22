import { describe, expect, it } from "vitest";

import { applyQuizPlayShuffle } from "./applyQuizPlayShuffle";

describe("applyQuizPlayShuffle", () => {
  const questions = [
    { id: "q1", options: [{ id: "a" }, { id: "b" }] },
    { id: "q2", options: [{ id: "c" }, { id: "d" }] },
  ];

  it("returns questions in original order when shuffle is disabled", () => {
    const result = applyQuizPlayShuffle(questions, {
      randomizeQuestions: false,
      randomizeOptions: false,
    });
    expect(result.map((q) => q.id)).toEqual(["q1", "q2"]);
    expect(result[0].options.map((o) => o.id)).toEqual(["a", "b"]);
  });

  it("shuffles questions when randomizeQuestions is enabled", () => {
    const result = applyQuizPlayShuffle(
      questions,
      { randomizeQuestions: true, randomizeOptions: false },
      () => 0.1,
    );

    expect(result.map((q) => q.id)).toEqual(["q2", "q1"]);
  });

  it("shuffles options when randomizeOptions is enabled", () => {
    const result = applyQuizPlayShuffle(
      questions,
      { randomizeQuestions: false, randomizeOptions: true },
      () => 0.1,
    );

    expect(result[0].options.map((o) => o.id)).toEqual(["b", "a"]);
  });
});
