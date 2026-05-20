import { describe, expect, it } from "vitest";

import {
  isQuizAnswerLocked,
  shouldShowQuizAnswerCorrection,
} from "./quizAnswerLock";

describe("isQuizAnswerLocked", () => {
  it("returns false when state is undefined", () => {
    expect(isQuizAnswerLocked(undefined)).toBe(false);
  });

  it("returns false when state is null", () => {
    expect(isQuizAnswerLocked(null)).toBe(false);
  });

  it("returns false when no lock flag is set", () => {
    expect(
      isQuizAnswerLocked({
        isVerified: false,
        isLocked: false,
        isExpired: false,
      }),
    ).toBe(false);
  });

  it("returns true when isVerified is true", () => {
    expect(isQuizAnswerLocked({ isVerified: true })).toBe(true);
  });

  it("returns true when isLocked is true", () => {
    expect(isQuizAnswerLocked({ isLocked: true })).toBe(true);
  });

  it("returns true when isExpired is true", () => {
    expect(isQuizAnswerLocked({ isExpired: true })).toBe(true);
  });

  it("returns true when several lock flags are combined", () => {
    expect(
      isQuizAnswerLocked({ isVerified: true, isExpired: true }),
    ).toBe(true);
  });
});

describe("shouldShowQuizAnswerCorrection", () => {
  it("returns false when neither flag is true", () => {
    expect(
      shouldShowQuizAnswerCorrection({
        isVerified: false,
        showAnswerImmediately: false,
      }),
    ).toBe(false);
  });

  it("returns false when verified but immediate mode is off", () => {
    expect(
      shouldShowQuizAnswerCorrection({
        isVerified: true,
        showAnswerImmediately: false,
      }),
    ).toBe(false);
  });

  it("returns false when immediate mode is on but not verified", () => {
    expect(
      shouldShowQuizAnswerCorrection({
        isVerified: false,
        showAnswerImmediately: true,
      }),
    ).toBe(false);
  });

  it("returns true only when both flags are true", () => {
    expect(
      shouldShowQuizAnswerCorrection({
        isVerified: true,
        showAnswerImmediately: true,
      }),
    ).toBe(true);
  });

  it("treats missing fields as false", () => {
    expect(shouldShowQuizAnswerCorrection({})).toBe(false);
  });
});
