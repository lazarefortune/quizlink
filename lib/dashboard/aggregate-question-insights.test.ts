import { describe, expect, it } from "vitest";

import { aggregateQuestionInsights } from "./aggregate-question-insights";

describe("aggregateQuestionInsights", () => {
  it("aggregates success rate, timing, and option distribution per question", () => {
    const insights = aggregateQuestionInsights(
      [
        {
          id: "q1",
          options: [
            { id: "a", label: "A", isCorrect: true },
            { id: "b", label: "B", isCorrect: false },
          ],
        },
      ],
      [
        {
          questionId: "q1",
          isCorrect: true,
          expired: false,
          timeSpent: 10,
          selectedOptionIds: ["a"],
        },
        {
          questionId: "q1",
          isCorrect: false,
          expired: true,
          timeSpent: 30,
          selectedOptionIds: ["b"],
        },
      ],
    );

    expect(insights).toHaveLength(1);
    expect(insights[0]?.responseCount).toBe(2);
    expect(insights[0]?.successRate).toBe(50);
    expect(insights[0]?.averageTimeSeconds).toBe(20);
    expect(insights[0]?.expiredCount).toBe(1);
    expect(insights[0]?.optionDistribution).toEqual([
      { optionId: "a", label: "A", isCorrect: true, count: 1, percentage: 50 },
      { optionId: "b", label: "B", isCorrect: false, count: 1, percentage: 50 },
    ]);
  });

  it("returns zeroed insights for questions without answers", () => {
    const insights = aggregateQuestionInsights(
      [{ id: "q1", options: [{ id: "a", label: "A", isCorrect: true }] }],
      [],
    );

    expect(insights[0]).toMatchObject({
      questionId: "q1",
      responseCount: 0,
      successRate: null,
      averageTimeSeconds: null,
      expiredCount: 0,
      optionDistribution: [
        { optionId: "a", label: "A", isCorrect: true, count: 0, percentage: 0 },
      ],
    });
  });
});
