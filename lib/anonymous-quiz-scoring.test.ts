import { describe, expect, it } from "vitest";
import {
  correctOptionIdsFromDbOptions,
  isSelectionCorrect,
} from "./anonymous-quiz-scoring";

describe("anonymous-quiz-scoring", () => {
  it("correctOptionIdsFromDbOptions returns ids marked correct", () => {
    expect(
      correctOptionIdsFromDbOptions([
        { id: "a", isCorrect: true },
        { id: "b", isCorrect: false },
      ])
    ).toEqual(["a"]);
  });

  it("isSelectionCorrect is true when sets match", () => {
    const opts = [
      { id: "a", isCorrect: true },
      { id: "b", isCorrect: false },
    ];
    expect(isSelectionCorrect(["a"], opts)).toBe(true);
    expect(isSelectionCorrect(["b"], opts)).toBe(false);
    expect(isSelectionCorrect(["a", "b"], opts)).toBe(false);
  });
});
