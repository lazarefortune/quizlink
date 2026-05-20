import { describe, expect, it } from "vitest";

import {
  findNextUnlockedQuestionId,
  findQuestionIndexById,
  formatQuizTimeLeftDesktopLabel,
  shouldShowBackToCurrentQuestion,
} from "./quizActiveTimedQuestion";

const questions = [{ id: "q1" }, { id: "q2" }, { id: "q3" }];

describe("shouldShowBackToCurrentQuestion", () => {
  it("returns false when activeTimedQuestionId is null", () => {
    expect(shouldShowBackToCurrentQuestion("q1", null)).toBe(false);
  });

  it("returns false when viewedQuestionId is null", () => {
    expect(shouldShowBackToCurrentQuestion(null, "q2")).toBe(false);
  });

  it("returns false when viewing the active timed question", () => {
    expect(shouldShowBackToCurrentQuestion("q2", "q2")).toBe(false);
  });

  it("returns true when viewing a different question than the active timed one", () => {
    expect(shouldShowBackToCurrentQuestion("q1", "q2")).toBe(true);
  });
});

describe("findQuestionIndexById", () => {
  it("returns the index when the question exists", () => {
    expect(findQuestionIndexById(questions, "q2")).toBe(1);
  });

  it("returns null when the question id is missing", () => {
    expect(findQuestionIndexById(questions, "missing")).toBeNull();
  });

  it("returns null when questionId is null", () => {
    expect(findQuestionIndexById(questions, null)).toBeNull();
  });
});

describe("findNextUnlockedQuestionId", () => {
  it("returns the first unlocked question from the start", () => {
    const answers = {
      q1: { isLocked: true },
      q2: { isLocked: false },
      q3: { isLocked: false },
    };
    expect(findNextUnlockedQuestionId(questions, answers)).toBe("q2");
  });

  it("returns the next unlocked question after a given question", () => {
    const answers = {
      q1: { isLocked: true },
      q2: { isLocked: true },
      q3: { isLocked: false },
    };
    expect(findNextUnlockedQuestionId(questions, answers, "q2")).toBe("q3");
  });

  it("returns null when every remaining question is locked", () => {
    const answers = {
      q1: { isLocked: true },
      q2: { isLocked: true },
      q3: { isLocked: true },
    };
    expect(findNextUnlockedQuestionId(questions, answers, "q2")).toBeNull();
  });
});

describe("formatQuizTimeLeftDesktopLabel", () => {
  it("formats the desktop label with seconds", () => {
    expect(formatQuizTimeLeftDesktopLabel("Temps restant", 32)).toBe(
      "Temps restant : 32s",
    );
  });
});
