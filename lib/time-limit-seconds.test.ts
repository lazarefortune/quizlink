import { describe, expect, it } from "vitest";
import {
  TIME_LIMIT_SECONDS_MAX,
  buildQuizSettingsWithResolvedTimeLimit,
  deriveTimeLimitUiFromSettings,
  parseTimeLimitSeconds,
  resolvePersistedTimeLimit,
} from "./time-limit-seconds";
import type { QuizSettings } from "@/types/quiz-builder";

const baseSettings: QuizSettings = {
  showAnswerImmediately: true,
  randomizeQuestions: false,
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
});

describe("deriveTimeLimitUiFromSettings", () => {
  it("disables when limit is null or non-positive", () => {
    expect(deriveTimeLimitUiFromSettings({ timeLimitPerQuestion: null })).toEqual({
      enabled: false,
      inputValue: "",
    });
    expect(deriveTimeLimitUiFromSettings({ timeLimitPerQuestion: 0 })).toEqual({
      enabled: false,
      inputValue: "",
    });
  });

  it("enables and stringifies a positive limit", () => {
    expect(deriveTimeLimitUiFromSettings({ timeLimitPerQuestion: 45 })).toEqual({
      enabled: true,
      inputValue: "45",
    });
  });
});

describe("resolvePersistedTimeLimit", () => {
  it("returns null when disabled", () => {
    expect(
      resolvePersistedTimeLimit(
        { timeLimitPerQuestion: 30 },
        { enabled: false, inputValue: "" },
      ),
    ).toBeNull();
  });

  it("returns parsed value when enabled and input valid", () => {
    expect(
      resolvePersistedTimeLimit(
        { timeLimitPerQuestion: 30 },
        { enabled: true, inputValue: "120" },
      ),
    ).toBe(120);
  });

  it("falls back to settings when enabled but input empty", () => {
    expect(
      resolvePersistedTimeLimit(
        { timeLimitPerQuestion: 30 },
        { enabled: true, inputValue: "" },
      ),
    ).toBe(30);
  });
});

describe("buildQuizSettingsWithResolvedTimeLimit", () => {
  it("clears limit when disabled", () => {
    const next = buildQuizSettingsWithResolvedTimeLimit(
      { ...baseSettings, timeLimitPerQuestion: 30 },
      { enabled: false, inputValue: "" },
    );
    expect(next.timeLimitPerQuestion).toBeNull();
  });

  it("sets numeric limit when enabled and valid", () => {
    const next = buildQuizSettingsWithResolvedTimeLimit(baseSettings, {
      enabled: true,
      inputValue: "90",
    });
    expect(next.timeLimitPerQuestion).toBe(90);
  });

  it("does not overwrite settings when enabled but input invalid", () => {
    const settings = { ...baseSettings, timeLimitPerQuestion: 30 };
    const next = buildQuizSettingsWithResolvedTimeLimit(settings, {
      enabled: true,
      inputValue: "",
    });
    expect(next).toBe(settings);
  });
});
