import { describe, expect, it } from "vitest";
import {
  isQuizUntitledForDesktopSelection,
  resolveActiveQuestionIdAfterQuestionDelete,
  resolveDesktopBuilderSelectionAfterQuestionDelete,
  resolveInitialDesktopActiveQuestionId,
  resolveInitialDesktopBuilderSelection,
} from "@/lib/builder/desktopBuilderSelection";
import type { Question } from "@/types/quiz-builder";

const q1: Question = {
  id: "q1",
  type: "MULTIPLE_CHOICE",
  label: "One",
  options: [],
};

const q2: Question = {
  id: "q2",
  type: "MULTIPLE_CHOICE",
  label: "Two",
  options: [],
};

describe("resolveInitialDesktopBuilderSelection", () => {
  it("selects settings when there are no questions", () => {
    expect(
      resolveInitialDesktopBuilderSelection({
        quizName: "My quiz",
        questions: [],
        defaultDraftName: "Quiz sans titre",
      }),
    ).toEqual({ view: "settings" });
  });

  it("selects settings when the quiz is untitled", () => {
    expect(
      resolveInitialDesktopBuilderSelection({
        quizName: "Quiz sans titre",
        questions: [q1],
        defaultDraftName: "Quiz sans titre",
      }),
    ).toEqual({ view: "settings" });
  });

  it("selects the questions canvas for a titled quiz with questions", () => {
    expect(
      resolveInitialDesktopBuilderSelection({
        quizName: "Weekend trivia",
        questions: [q1, q2],
        defaultDraftName: "Quiz sans titre",
      }),
    ).toEqual({ view: "questions" });
  });
});

describe("resolveInitialDesktopActiveQuestionId", () => {
  it("returns the first question id when questions exist", () => {
    expect(resolveInitialDesktopActiveQuestionId([q1, q2])).toBe("q1");
  });

  it("returns null when there are no questions", () => {
    expect(resolveInitialDesktopActiveQuestionId([])).toBeNull();
  });
});

describe("resolveDesktopBuilderSelectionAfterQuestionDelete", () => {
  it("falls back to settings when the last question is deleted", () => {
    expect(
      resolveDesktopBuilderSelectionAfterQuestionDelete({ view: "questions" }, []),
    ).toEqual({ view: "settings" });
  });

  it("stays on the questions canvas when questions remain", () => {
    expect(
      resolveDesktopBuilderSelectionAfterQuestionDelete({ view: "questions" }, [q2]),
    ).toEqual({ view: "questions" });
  });
});

describe("resolveActiveQuestionIdAfterQuestionDelete", () => {
  it("selects a neighbor when the active question is deleted", () => {
    expect(
      resolveActiveQuestionIdAfterQuestionDelete("q1", "q1", [q1, q2], [q2]),
    ).toBe("q2");
  });

  it("keeps the current active id when another question is deleted", () => {
    expect(
      resolveActiveQuestionIdAfterQuestionDelete("q2", "q1", [q1, q2], [q2]),
    ).toBe("q2");
  });
});

describe("isQuizUntitledForDesktopSelection", () => {
  it("treats empty and default draft names as untitled", () => {
    expect(isQuizUntitledForDesktopSelection("", "Quiz sans titre")).toBe(true);
    expect(isQuizUntitledForDesktopSelection("Quiz sans titre", "Quiz sans titre")).toBe(true);
    expect(isQuizUntitledForDesktopSelection("My quiz", "Quiz sans titre")).toBe(false);
  });
});
