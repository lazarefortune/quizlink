import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildQuizPreviewPath } from "@/lib/quiz/quiz-preview-routes";

describe("QuizDetailHeader preview link", () => {
  it("points to immersive preview route", () => {
    const headerPath = resolve(
      process.cwd(),
      "components/dashboard/quiz-detail/quiz-detail-header.tsx",
    );
    const source = readFileSync(headerPath, "utf8");

    expect(source).toContain("buildQuizPreviewPath");
    expect(source).not.toContain("/dashboard/quiz/${quizId}/preview");
    expect(buildQuizPreviewPath("quiz-99")).toBe("/preview/quiz/quiz-99");
  });
});
