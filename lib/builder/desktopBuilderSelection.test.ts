import { describe, expect, it } from "vitest";

import {
  isQuizUntitledForDesktopSelection,
  resolveInitialDesktopBuilderSelection,
} from "@/lib/builder/desktopBuilderSelection";
import type { Question } from "@/types/quiz-builder";

const q1: Question = {
  id: "q1",
  type: "MULTIPLE_CHOICE",
  label: "One",
  options: [],
};

describe("resolveInitialDesktopBuilderSelection", () => {
  it("selects settings when there are no questions", () => {
    expect(
      resolveInitialDesktopBuilderSelection({
        quizName: "My quiz",
        questions: [],
      }),
    ).toEqual({ view: "settings" });
  });

  it("selects the questions canvas when the quiz has questions, even without a title", () => {
    expect(
      resolveInitialDesktopBuilderSelection({
        quizName: "",
        questions: [q1],
      }),
    ).toEqual({ view: "questions" });
  });

  it("selects the questions canvas for a titled quiz with questions", () => {
    expect(
      resolveInitialDesktopBuilderSelection({
        quizName: "Weekend trivia",
        questions: [q1],
      }),
    ).toEqual({ view: "questions" });
  });
});

describe("isQuizUntitledForDesktopSelection", () => {
  it("treats empty and legacy sentinel names as untitled", () => {
    expect(isQuizUntitledForDesktopSelection("")).toBe(true);
    expect(isQuizUntitledForDesktopSelection("Quiz sans titre")).toBe(true);
    expect(isQuizUntitledForDesktopSelection("Untitled quiz")).toBe(true);
    expect(isQuizUntitledForDesktopSelection("My quiz")).toBe(false);
  });
});
