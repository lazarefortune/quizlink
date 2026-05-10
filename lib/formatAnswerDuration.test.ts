import { describe, expect, it } from "vitest";

import { formatAnswerDuration } from "./formatAnswerDuration";

describe("formatAnswerDuration", () => {
  it("returns '0 s' when seconds is 0", () => {
    expect(formatAnswerDuration(0)).toBe("0 s");
  });

  it("returns '0 s' for negative numbers", () => {
    expect(formatAnswerDuration(-5)).toBe("0 s");
  });

  it("returns '0 s' for non-finite values", () => {
    expect(formatAnswerDuration(Number.NaN)).toBe("0 s");
    expect(formatAnswerDuration(Number.POSITIVE_INFINITY)).toBe("0 s");
  });

  it("formats sub-minute durations as 'X s'", () => {
    expect(formatAnswerDuration(1)).toBe("1 s");
    expect(formatAnswerDuration(42)).toBe("42 s");
    expect(formatAnswerDuration(59)).toBe("59 s");
  });

  it("formats minute durations as 'X min Y s'", () => {
    expect(formatAnswerDuration(60)).toBe("1 min 0 s");
    expect(formatAnswerDuration(72)).toBe("1 min 12 s");
    expect(formatAnswerDuration(125)).toBe("2 min 5 s");
  });

  it("floors fractional seconds", () => {
    expect(formatAnswerDuration(72.9)).toBe("1 min 12 s");
    expect(formatAnswerDuration(0.7)).toBe("0 s");
  });
});
