import { describe, expect, it } from "vitest";

import {
  createQuestionTimerDeadline,
  getRemainingSecondsFromDeadline,
  isQuestionTimerExpired,
} from "./quizQuestionTimerDeadline";

describe("createQuestionTimerDeadline", () => {
  it("returns null when totalSeconds is 0", () => {
    expect(createQuestionTimerDeadline(0, 1_000)).toBeNull();
  });

  it("returns null when totalSeconds is negative", () => {
    expect(createQuestionTimerDeadline(-5, 1_000)).toBeNull();
  });

  it("creates a deadline from totalSeconds and now", () => {
    const now = 10_000;
    expect(createQuestionTimerDeadline(60, now)).toEqual({
      startedAt: now,
      deadlineAt: now + 60_000,
    });
  });
});

describe("getRemainingSecondsFromDeadline", () => {
  it("returns full budget when now equals startedAt", () => {
    const deadline = 70_000;
    expect(getRemainingSecondsFromDeadline(deadline, 10_000)).toBe(60);
  });

  it("subtracts elapsed time even when the question is not active", () => {
    const deadline = 70_000;
    expect(getRemainingSecondsFromDeadline(deadline, 30_000)).toBe(40);
  });

  it("clamps to 0 when deadline is passed", () => {
    const deadline = 70_000;
    expect(getRemainingSecondsFromDeadline(deadline, 80_000)).toBe(0);
  });

  it("ceil partial seconds so 500ms left shows 1s", () => {
    const deadline = 10_500;
    expect(getRemainingSecondsFromDeadline(deadline, 10_000)).toBe(1);
  });
});

describe("isQuestionTimerExpired", () => {
  it("returns false before deadline", () => {
    expect(isQuestionTimerExpired(70_000, 69_999)).toBe(false);
  });

  it("returns true exactly at deadline", () => {
    expect(isQuestionTimerExpired(70_000, 70_000)).toBe(true);
  });

  it("returns true after deadline", () => {
    expect(isQuestionTimerExpired(70_000, 80_000)).toBe(true);
  });
});
