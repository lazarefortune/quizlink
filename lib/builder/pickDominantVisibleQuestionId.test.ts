import { describe, expect, it } from "vitest";
import { pickDominantVisibleQuestionId } from "./pickDominantVisibleQuestionId";

describe("pickDominantVisibleQuestionId", () => {
  it("returns the id with the largest ratio", () => {
    const ratios = new Map([
      ["a", 0.2],
      ["b", 0.6],
      ["c", 0.1],
    ]);
    expect(pickDominantVisibleQuestionId(ratios, ["a", "b", "c"])).toBe("b");
  });

  it("uses question order as tie-breaker (first wins)", () => {
    const ratios = new Map([
      ["a", 0.5],
      ["b", 0.5],
    ]);
    expect(pickDominantVisibleQuestionId(ratios, ["a", "b"])).toBe("a");
    expect(pickDominantVisibleQuestionId(ratios, ["b", "a"])).toBe("b");
  });

  it("returns null when all ratios are zero or missing", () => {
    expect(pickDominantVisibleQuestionId(new Map(), ["a", "b"])).toBe(null);
    expect(
      pickDominantVisibleQuestionId(
        new Map([
          ["a", 0],
          ["b", 0],
        ]),
        ["a", "b"],
      ),
    ).toBe(null);
  });
});
