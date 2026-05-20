import { describe, expect, it } from "vitest";

import {
  formatQuizTimeRemainingAriaLabel,
  formatQuizTimeRemainingHuman,
} from "./formatQuizTimeRemainingHuman";

describe("formatQuizTimeRemainingHuman", () => {
  it("formats sub-minute durations with seconds", () => {
    expect(formatQuizTimeRemainingHuman(45, "fr")).toBe("45\u00a0s");
    expect(formatQuizTimeRemainingHuman(45, "en")).toBe("45\u00a0sec");
  });

  it("formats minute durations as m:ss", () => {
    expect(formatQuizTimeRemainingHuman(90, "fr")).toBe("1:30");
    expect(formatQuizTimeRemainingHuman(125, "en")).toBe("2:05");
  });

  it("formats hour durations with hours and minutes", () => {
    expect(formatQuizTimeRemainingHuman(3665, "fr")).toBe("1\u00a0h\u00a01\u00a0min");
    expect(formatQuizTimeRemainingHuman(3600, "en")).toBe("1h");
  });

  it("clamps negative values to zero", () => {
    expect(formatQuizTimeRemainingHuman(-3, "fr")).toBe("0\u00a0s");
  });
});

describe("formatQuizTimeRemainingAriaLabel", () => {
  it("uses full words for screen readers", () => {
    expect(formatQuizTimeRemainingAriaLabel(45, "fr")).toBe("45 secondes restantes");
    expect(formatQuizTimeRemainingAriaLabel(90, "fr")).toBe("1 min 30 s restantes");
  });
});
