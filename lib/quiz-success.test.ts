import { describe, expect, it } from "vitest";

import { buildQuizSuccessPath, shouldRedirectToQuizSuccess } from "@/lib/quiz-success";

describe("quiz success helpers", () => {
  it("builds the success path from quiz id", () => {
    expect(buildQuizSuccessPath("quiz_123")).toBe("/dashboard/quiz/quiz_123/success");
  });

  it("redirects only when quiz is newly created", () => {
    expect(
      shouldRedirectToQuizSuccess({
        isExistingQuiz: false,
        quizId: "quiz_123",
      })
    ).toBe(true);

    expect(
      shouldRedirectToQuizSuccess({
        isExistingQuiz: true,
        quizId: "quiz_123",
      })
    ).toBe(false);

    expect(
      shouldRedirectToQuizSuccess({
        isExistingQuiz: false,
        quizId: "",
      })
    ).toBe(false);
  });
});
