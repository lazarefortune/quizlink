import { describe, expect, it } from "vitest";

import { resolveQuizTimerInfo } from "./quizTimerState";

describe("resolveQuizTimerInfo", () => {
  it("returns null when totalSeconds is 0", () => {
    expect(resolveQuizTimerInfo(10, 0)).toBeNull();
  });

  it("returns null when totalSeconds is negative", () => {
    expect(resolveQuizTimerInfo(10, -5)).toBeNull();
  });

  it("returns null when totalSeconds is null", () => {
    expect(resolveQuizTimerInfo(10, null)).toBeNull();
  });

  it("returns null when totalSeconds is undefined", () => {
    expect(resolveQuizTimerInfo(10, undefined)).toBeNull();
  });

  it("returns null when timeLeftSeconds is null", () => {
    expect(resolveQuizTimerInfo(null, 30)).toBeNull();
  });

  it("returns null when timeLeftSeconds is undefined", () => {
    expect(resolveQuizTimerInfo(undefined, 30)).toBeNull();
  });

  it("clamps percent to 100 when timeLeft exceeds total", () => {
    expect(resolveQuizTimerInfo(80, 60)).toEqual({
      percent: 100,
      state: "normal",
    });
  });

  it("clamps percent to 0 when timeLeft is negative", () => {
    expect(resolveQuizTimerInfo(-3, 60)).toEqual({
      percent: 0,
      state: "danger",
    });
  });

  it("reports normal state above 50 percent", () => {
    expect(resolveQuizTimerInfo(45, 60)).toEqual({
      percent: 75,
      state: "normal",
    });
  });

  it("reports warning state at exactly 50 percent", () => {
    expect(resolveQuizTimerInfo(30, 60)).toEqual({
      percent: 50,
      state: "warning",
    });
  });

  it("reports warning state between 20 and 50 percent", () => {
    expect(resolveQuizTimerInfo(18, 60)).toEqual({
      percent: 30,
      state: "warning",
    });
  });

  it("reports danger state at exactly 20 percent", () => {
    expect(resolveQuizTimerInfo(12, 60)).toEqual({
      percent: 20,
      state: "danger",
    });
  });

  it("reports danger state below 20 percent", () => {
    expect(resolveQuizTimerInfo(6, 60)).toEqual({
      percent: 10,
      state: "danger",
    });
  });

  it("reports danger state at 0 seconds", () => {
    expect(resolveQuizTimerInfo(0, 60)).toEqual({
      percent: 0,
      state: "danger",
    });
  });
});
