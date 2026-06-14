import { describe, expect, it } from "vitest";

import { buildQuizAggregatesFromHistory } from "../lib/quiz/buildQuizResponseAggregatesFromHistory";
import {
  parseBackfillQuizResponseAggregatesOptions,
  summarizeBuiltAggregates,
} from "./backfill-quiz-response-aggregates";

describe("parseBackfillQuizResponseAggregatesOptions", () => {
  it("parses dry-run, apply, quizId and batchSize", () => {
    expect(
      parseBackfillQuizResponseAggregatesOptions([
        "--dry-run",
        "--quizId=quiz-1",
        "--batchSize=25",
      ]),
    ).toEqual({
      dryRun: true,
      apply: false,
      quizId: "quiz-1",
      batchSize: 25,
    });
  });

  it("falls back to default batch size when invalid", () => {
    expect(
      parseBackfillQuizResponseAggregatesOptions(["--apply", "--batchSize=0"]),
    ).toEqual({
      dryRun: false,
      apply: true,
      quizId: undefined,
      batchSize: 100,
    });
  });
});

describe("summarizeBuiltAggregates", () => {
  it("summarizes built aggregates for logging", () => {
    const attempts = [
      {
        id: "a1",
        status: "COMPLETED",
        score: 100,
        totalQuestions: 1,
        durationSeconds: 30,
      },
    ];
    const answers = [
      {
        questionId: "q1",
        isCorrect: true,
        expired: false,
        timeSpentSeconds: 10,
      },
    ];
    const built = buildQuizAggregatesFromHistory({
      quizId: "quiz-1",
      attempts,
      answersFromCompletedAttempts: answers,
    });

    expect(summarizeBuiltAggregates("quiz-1", attempts, answers, built)).toEqual({
      quizId: "quiz-1",
      attemptCount: 1,
      completedAttemptCount: 1,
      answerCount: 1,
      questionStatsCount: 1,
      hasResponseStats: true,
    });
  });
});
