import { describe, expect, it } from "vitest";

import {
  formatQuizTimeRemainingAriaLabel,
  formatQuizTimeRemainingCompact,
  formatQuizTimeRemainingHuman,
} from "./formatQuizTimeRemainingHuman";

describe("formatQuizTimeRemainingHuman", () => {
  it("formats sub-minute durations with seconds", () => {
    expect(formatQuizTimeRemainingHuman(45, "fr")).toBe("45\u00a0s");
    expect(formatQuizTimeRemainingHuman(45, "en")).toBe("45\u00a0sec");
  });

  it("formats minute durations with min units, not m:ss", () => {
    expect(formatQuizTimeRemainingHuman(60, "fr")).toBe("1\u00a0min");
    expect(formatQuizTimeRemainingHuman(75, "fr")).toBe("1\u00a0min\u00a015\u00a0s");
    expect(formatQuizTimeRemainingHuman(90, "en")).toBe("1\u00a0min\u00a030\u00a0sec");
    expect(formatQuizTimeRemainingHuman(125, "en")).toBe("2\u00a0min\u00a05\u00a0sec");
  });

  it("formats hour durations with hours and minutes", () => {
    expect(formatQuizTimeRemainingHuman(3665, "fr")).toBe("1\u00a0h\u00a01\u00a0min");
    expect(formatQuizTimeRemainingHuman(3600, "en")).toBe("1\u00a0h");
  });

  it("clamps negative values to zero", () => {
    expect(formatQuizTimeRemainingHuman(-3, "fr")).toBe("0\u00a0s");
  });
});

describe("formatQuizTimeRemainingCompact", () => {
  it("formats sub-minute durations as seconds with suffix", () => {
    expect(formatQuizTimeRemainingCompact(45)).toBe("45s");
  });

  it("formats minute durations as m:ss for the circular timer", () => {
    expect(formatQuizTimeRemainingCompact(75)).toBe("1:15");
    expect(formatQuizTimeRemainingCompact(90)).toBe("1:30");
    expect(formatQuizTimeRemainingCompact(125)).toBe("2:05");
  });
});

describe("formatQuizTimeRemainingAriaLabel", () => {
  it("uses full words for screen readers", () => {
    expect(formatQuizTimeRemainingAriaLabel(45, "fr")).toBe("45 secondes restantes");
    expect(formatQuizTimeRemainingAriaLabel(75, "fr")).toBe("1 min 15 s restantes");
  });
});
