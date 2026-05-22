import { describe, expect, it } from "vitest";

import { getQuizPlayOptionVisualState } from "./quizPlayOptionStyles";

describe("getQuizPlayOptionVisualState", () => {
  it("uses green styling for correct answers when correction is shown", () => {
    const state = getQuizPlayOptionVisualState({
      showCorrection: true,
      selected: true,
      correct: true,
      incorrect: false,
    });

    expect(state.borderColor).toBe("#22c55e");
    expect(state.letterBgColor).toBe("bg-green-500");
  });

  it("uses blue styling for selected answers without correction", () => {
    const state = getQuizPlayOptionVisualState({
      showCorrection: false,
      selected: true,
      correct: false,
      incorrect: false,
    });

    expect(state.borderColor).toBe("hsl(var(--blue))");
    expect(state.letterBgColor).toBe("bg-blue");
  });
});
