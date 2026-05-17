import { describe, expect, it } from "vitest";
import {
  evaluateServerAutosaveGate,
  isBuilderQuizValidForFinalize,
  mergeBuilderSaveValidationErrors,
  SERVER_AUTOSAVE_DEBOUNCE_MS,
} from "@/lib/builder/serverAutosaveGate";
import type { QuizBuilder } from "@/types/quiz-builder";
import type { BuilderTimeLimitUi } from "@/lib/time-limit-seconds";

const baseQuiz = (): QuizBuilder => ({
  id: "clxxxxxxxxxxxxxxxxxx",
  name: "My quiz",
  visibility: "PRIVATE",
  settings: {
    showAnswerImmediately: true,
    randomizeQuestions: false,
    randomizeOptions: false,
    timeLimitPerQuestion: null,
  },
  questions: [
    {
      id: "q1",
      type: "MULTIPLE_CHOICE",
      label: "Q1",
      options: [
        { id: "o1", label: "A", isCorrect: true },
        { id: "o2", label: "B", isCorrect: false },
      ],
    },
  ],
  createdBy: "USER",
  createdAt: new Date().toISOString(),
});

const baseTimeLimitUi = (): BuilderTimeLimitUi => ({
  enabled: false,
  minutes: 0,
  seconds: 0,
});

describe("SERVER_AUTOSAVE_DEBOUNCE_MS", () => {
  it("is 5s for responsive UX while debouncing bursts", () => {
    expect(SERVER_AUTOSAVE_DEBOUNCE_MS).toBe(5_000);
  });
});

describe("mergeBuilderSaveValidationErrors", () => {
  it("returns errors when time limit is enabled but invalid", () => {
    const quiz = baseQuiz();
    const ui: BuilderTimeLimitUi = { enabled: true, minutes: 0, seconds: 0 };
    const merged = mergeBuilderSaveValidationErrors(quiz, ui);
    expect(merged.some((e) => e.field === "settings.timeLimitPerQuestion")).toBe(true);
  });

  it("returns empty when time limit is disabled even if parts look odd", () => {
    const quiz = baseQuiz();
    const ui: BuilderTimeLimitUi = { enabled: false, minutes: 99, seconds: 99 };
    expect(mergeBuilderSaveValidationErrors(quiz, ui)).toEqual([]);
  });
});

describe("isBuilderQuizValidForFinalize", () => {
  it("is false when there are no questions", () => {
    const quiz = { ...baseQuiz(), questions: [] };
    expect(isBuilderQuizValidForFinalize(quiz, baseTimeLimitUi())).toBe(false);
  });

  it("is false when the quiz name is invalid", () => {
    const quiz = { ...baseQuiz(), name: "   " };
    expect(isBuilderQuizValidForFinalize(quiz, baseTimeLimitUi())).toBe(false);
  });

  it("is false when time limit is enabled but invalid", () => {
    const quiz = baseQuiz();
    const ui: BuilderTimeLimitUi = { enabled: true, minutes: 0, seconds: 0 };
    expect(isBuilderQuizValidForFinalize(quiz, ui)).toBe(false);
  });

  it("is true for a minimal valid quiz and time limit UI", () => {
    expect(isBuilderQuizValidForFinalize(baseQuiz(), baseTimeLimitUi())).toBe(true);
  });
});

describe("evaluateServerAutosaveGate", () => {
  const baseline = "snap-a";
  const other = "snap-b";

  it("blocks when there is no server quiz id", () => {
    const quiz = baseQuiz();
    expect(
      evaluateServerAutosaveGate({
        savedQuizId: null,
        quizLifecycleStatus: "DRAFT",
        baselineSnapshot: baseline,
        currentSnapshot: other,
        quizForValidation: quiz,
        timeLimitUi: baseTimeLimitUi(),
        estimatedPayloadBytes: 100,
        autosavePayloadMaxBytes: 1_000_000,
      }),
    ).toEqual({ proceed: false, reason: "no_server_quiz_id" });
  });

  it("blocks server autosave when quiz is ACTIVE", () => {
    const quiz = baseQuiz();
    expect(
      evaluateServerAutosaveGate({
        savedQuizId: "clid",
        quizLifecycleStatus: "ACTIVE",
        baselineSnapshot: baseline,
        currentSnapshot: other,
        quizForValidation: quiz,
        timeLimitUi: baseTimeLimitUi(),
        estimatedPayloadBytes: 100,
        autosavePayloadMaxBytes: 1_000_000,
      }),
    ).toEqual({ proceed: false, reason: "not_draft" });
  });

  it("blocks server autosave when quiz is ARCHIVED", () => {
    const quiz = baseQuiz();
    expect(
      evaluateServerAutosaveGate({
        savedQuizId: "clid",
        quizLifecycleStatus: "ARCHIVED",
        baselineSnapshot: baseline,
        currentSnapshot: other,
        quizForValidation: quiz,
        timeLimitUi: baseTimeLimitUi(),
        estimatedPayloadBytes: 100,
        autosavePayloadMaxBytes: 1_000_000,
      }),
    ).toEqual({ proceed: false, reason: "not_draft" });
  });

  it("blocks server autosave when lifecycle status is not loaded yet", () => {
    const quiz = baseQuiz();
    expect(
      evaluateServerAutosaveGate({
        savedQuizId: "clid",
        quizLifecycleStatus: null,
        baselineSnapshot: baseline,
        currentSnapshot: other,
        quizForValidation: quiz,
        timeLimitUi: baseTimeLimitUi(),
        estimatedPayloadBytes: 100,
        autosavePayloadMaxBytes: 1_000_000,
      }),
    ).toEqual({ proceed: false, reason: "not_draft" });
  });

  it("blocks when baseline is missing", () => {
    const quiz = baseQuiz();
    expect(
      evaluateServerAutosaveGate({
        savedQuizId: "clid",
        quizLifecycleStatus: "DRAFT",
        baselineSnapshot: null,
        currentSnapshot: other,
        quizForValidation: quiz,
        timeLimitUi: baseTimeLimitUi(),
        estimatedPayloadBytes: 100,
        autosavePayloadMaxBytes: 1_000_000,
      }),
    ).toEqual({ proceed: false, reason: "baseline_missing" });
  });

  it("blocks when snapshot matches baseline", () => {
    const quiz = baseQuiz();
    expect(
      evaluateServerAutosaveGate({
        savedQuizId: "clid",
        quizLifecycleStatus: "DRAFT",
        baselineSnapshot: baseline,
        currentSnapshot: baseline,
        quizForValidation: quiz,
        timeLimitUi: baseTimeLimitUi(),
        estimatedPayloadBytes: 100,
        autosavePayloadMaxBytes: 1_000_000,
      }),
    ).toEqual({ proceed: false, reason: "clean" });
  });

  it("blocks when there are no questions", () => {
    const quiz = { ...baseQuiz(), questions: [] };
    expect(
      evaluateServerAutosaveGate({
        savedQuizId: "clid",
        quizLifecycleStatus: "DRAFT",
        baselineSnapshot: baseline,
        currentSnapshot: other,
        quizForValidation: quiz,
        timeLimitUi: baseTimeLimitUi(),
        estimatedPayloadBytes: 100,
        autosavePayloadMaxBytes: 1_000_000,
      }),
    ).toEqual({ proceed: false, reason: "no_questions" });
  });

  it("blocks when validation fails", () => {
    const quiz = { ...baseQuiz(), name: "   " };
    expect(
      evaluateServerAutosaveGate({
        savedQuizId: "clid",
        quizLifecycleStatus: "DRAFT",
        baselineSnapshot: baseline,
        currentSnapshot: other,
        quizForValidation: quiz,
        timeLimitUi: baseTimeLimitUi(),
        estimatedPayloadBytes: 100,
        autosavePayloadMaxBytes: 1_000_000,
      }),
    ).toEqual({ proceed: false, reason: "validation_errors" });
  });

  it("blocks when payload is at or over the autosave byte limit", () => {
    const quiz = baseQuiz();
    expect(
      evaluateServerAutosaveGate({
        savedQuizId: "clid",
        quizLifecycleStatus: "DRAFT",
        baselineSnapshot: baseline,
        currentSnapshot: other,
        quizForValidation: quiz,
        timeLimitUi: baseTimeLimitUi(),
        estimatedPayloadBytes: 500,
        autosavePayloadMaxBytes: 500,
      }),
    ).toEqual({ proceed: false, reason: "payload_over_autosave_limit" });
  });

  it("blocks when draft server autosave is disabled in settings", () => {
    const q = baseQuiz();
    const quiz = { ...q, settings: { ...q.settings, autoSaveEnabled: false } };
    expect(
      evaluateServerAutosaveGate({
        savedQuizId: "clid",
        quizLifecycleStatus: "DRAFT",
        baselineSnapshot: baseline,
        currentSnapshot: other,
        quizForValidation: quiz,
        timeLimitUi: baseTimeLimitUi(),
        estimatedPayloadBytes: 100,
        autosavePayloadMaxBytes: 1_000_000,
      }),
    ).toEqual({ proceed: false, reason: "auto_save_disabled" });
  });

  it("allows when all preconditions pass for DRAFT", () => {
    const quiz = baseQuiz();
    expect(
      evaluateServerAutosaveGate({
        savedQuizId: "clid",
        quizLifecycleStatus: "DRAFT",
        baselineSnapshot: baseline,
        currentSnapshot: other,
        quizForValidation: quiz,
        timeLimitUi: baseTimeLimitUi(),
        estimatedPayloadBytes: 499,
        autosavePayloadMaxBytes: 500,
      }),
    ).toEqual({ proceed: true });
  });
});
