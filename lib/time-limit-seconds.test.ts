import { describe, expect, it } from "vitest";
import {
  TIME_LIMIT_SECONDS_MAX,
  buildQuizSettingsWithResolvedTimeLimit,
  deriveTimeLimitUiFromSettings,
  isValidBuilderTimeLimitParts,
  parseTimeLimitSeconds,
  resolvePersistedTimeLimit,
  splitTotalSecondsToParts,
  totalSecondsFromMinutesSeconds,
} from "./time-limit-seconds";
import type { QuizSettings } from "@/types/quiz-builder";

const baseSettings: QuizSettings = {
  showAnswerImmediately: true,
  randomizeQuestions: false,
  randomizeOptions: false,
  timeLimitPerQuestion: null,
};

describe("parseTimeLimitSeconds", () => {
  it("returns null for empty or whitespace", () => {
    expect(parseTimeLimitSeconds("")).toBeNull();
    expect(parseTimeLimitSeconds("   ")).toBeNull();
  });

  it("parses valid integers in range", () => {
    expect(parseTimeLimitSeconds("1")).toBe(1);
    expect(parseTimeLimitSeconds("60")).toBe(60);
    expect(parseTimeLimitSeconds(String(TIME_LIMIT_SECONDS_MAX))).toBe(TIME_LIMIT_SECONDS_MAX);
  });

  it("rejects non-integers and out-of-range values", () => {
    expect(parseTimeLimitSeconds("1.5")).toBeNull();
    expect(parseTimeLimitSeconds("0")).toBeNull();
    expect(parseTimeLimitSeconds("-5")).toBeNull();
    expect(parseTimeLimitSeconds(String(TIME_LIMIT_SECONDS_MAX + 1))).toBeNull();
    expect(parseTimeLimitSeconds("abc")).toBeNull();
  });

  it("parses M:SS as minutes and seconds", () => {
    expect(parseTimeLimitSeconds("1:30")).toBe(90);
    expect(parseTimeLimitSeconds("0:45")).toBe(45);
    expect(parseTimeLimitSeconds("2:00")).toBe(120);
    expect(parseTimeLimitSeconds("1:60")).toBeNull();
    expect(parseTimeLimitSeconds("1:5")).toBe(65);
  });

  it("parses minute / second word forms", () => {
    expect(parseTimeLimitSeconds("2m")).toBe(120);
    expect(parseTimeLimitSeconds("2m30")).toBe(150);
    expect(parseTimeLimitSeconds("2 m 30")).toBe(150);
    expect(parseTimeLimitSeconds("2 min 30")).toBe(150);
    expect(parseTimeLimitSeconds("45s")).toBe(45);
    expect(parseTimeLimitSeconds("45 sec")).toBe(45);
    expect(parseTimeLimitSeconds("45 secondes")).toBe(45);
  });
});

describe("splitTotalSecondsToParts and totalSecondsFromMinutesSeconds", () => {
  it("splits 90 into 1 min 30 s", () => {
    expect(splitTotalSecondsToParts(90)).toEqual({ minutes: 1, seconds: 30 });
  });

  it("splits 45 into 0 min 45 s", () => {
    expect(splitTotalSecondsToParts(45)).toEqual({ minutes: 0, seconds: 45 });
  });

  it("splits 120 into 2 min 0 s", () => {
    expect(splitTotalSecondsToParts(120)).toEqual({ minutes: 2, seconds: 0 });
  });

  it("round-trips minutes and seconds to total", () => {
    expect(totalSecondsFromMinutesSeconds(1, 30)).toBe(90);
    expect(totalSecondsFromMinutesSeconds(0, 45)).toBe(45);
    expect(totalSecondsFromMinutesSeconds(2, 0)).toBe(120);
  });
});

describe("isValidBuilderTimeLimitParts", () => {
  it("rejects total 0 and seconds out of range", () => {
    expect(isValidBuilderTimeLimitParts(0, 0)).toBe(false);
    expect(isValidBuilderTimeLimitParts(0, 60)).toBe(false);
    expect(isValidBuilderTimeLimitParts(61, 0)).toBe(false);
  });

  it("accepts boundary totals", () => {
    expect(isValidBuilderTimeLimitParts(0, 1)).toBe(true);
    expect(isValidBuilderTimeLimitParts(60, 0)).toBe(true);
    expect(isValidBuilderTimeLimitParts(59, 59)).toBe(true);
  });

  it("rejects total above max", () => {
    expect(isValidBuilderTimeLimitParts(60, 1)).toBe(false);
  });
});

describe("deriveTimeLimitUiFromSettings", () => {
  it("disables when limit is null or non-positive", () => {
    expect(deriveTimeLimitUiFromSettings({ timeLimitPerQuestion: null })).toEqual({
      enabled: false,
      minutes: 0,
      seconds: 0,
    });
    expect(deriveTimeLimitUiFromSettings({ timeLimitPerQuestion: 0 })).toEqual({
      enabled: false,
      minutes: 0,
      seconds: 0,
    });
  });

  it("enables and splits a positive limit", () => {
    expect(deriveTimeLimitUiFromSettings({ timeLimitPerQuestion: 45 })).toEqual({
      enabled: true,
      minutes: 0,
      seconds: 45,
    });
    expect(deriveTimeLimitUiFromSettings({ timeLimitPerQuestion: 90 })).toEqual({
      enabled: true,
      minutes: 1,
      seconds: 30,
    });
  });
});

describe("resolvePersistedTimeLimit", () => {
  it("returns null when disabled", () => {
    expect(
      resolvePersistedTimeLimit(
        { timeLimitPerQuestion: 30 },
        { enabled: false, minutes: 0, seconds: 0 },
      ),
    ).toBeNull();
  });

  it("returns parsed value when enabled and parts valid", () => {
    expect(
      resolvePersistedTimeLimit(
        { timeLimitPerQuestion: 30 },
        { enabled: true, minutes: 2, seconds: 0 },
      ),
    ).toBe(120);
  });

  it("falls back to settings when enabled but parts invalid", () => {
    expect(
      resolvePersistedTimeLimit(
        { timeLimitPerQuestion: 30 },
        { enabled: true, minutes: 0, seconds: 0 },
      ),
    ).toBe(30);
  });
});

describe("buildQuizSettingsWithResolvedTimeLimit", () => {
  it("clears limit when disabled", () => {
    const next = buildQuizSettingsWithResolvedTimeLimit(
      { ...baseSettings, timeLimitPerQuestion: 30 },
      { enabled: false, minutes: 0, seconds: 0 },
    );
    expect(next.timeLimitPerQuestion).toBeNull();
  });

  it("sets numeric limit when enabled and valid", () => {
    const next = buildQuizSettingsWithResolvedTimeLimit(baseSettings, {
      enabled: true,
      minutes: 1,
      seconds: 30,
    });
    expect(next.timeLimitPerQuestion).toBe(90);
  });

  it("does not overwrite settings when enabled but parts invalid", () => {
    const settings = { ...baseSettings, timeLimitPerQuestion: 30 };
    const next = buildQuizSettingsWithResolvedTimeLimit(settings, {
      enabled: true,
      minutes: 0,
      seconds: 0,
    });
    expect(next).toBe(settings);
  });
});
