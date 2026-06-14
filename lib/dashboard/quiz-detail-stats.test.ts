import { describe, expect, it } from "vitest";

import {
  buildQuizAudienceSlices,
  buildQuizFunnelSteps,
  computeQuizCompletionRatePercent,
  shouldShowQuizDetailCharts,
} from "./quiz-detail-stats";

describe("quiz-detail-stats", () => {
  it("computes completion rate from responses over started", () => {
    expect(
      computeQuizCompletionRatePercent({ totalResponses: 25, totalStarted: 40 }),
    ).toBe(62.5);
    expect(computeQuizCompletionRatePercent({ totalResponses: 0, totalStarted: 0 })).toBe(0);
  });

  it("builds funnel steps in order", () => {
    expect(
      buildQuizFunnelSteps({ totalOpenCount: 10, totalStarted: 7, totalResponses: 4 }),
    ).toEqual([
      { key: "opens", value: 10 },
      { key: "started", value: 7 },
      { key: "completed", value: 4 },
    ]);
  });

  it("hides charts when all values are zero", () => {
    expect(
      shouldShowQuizDetailCharts(
        buildQuizFunnelSteps({ totalOpenCount: 0, totalStarted: 0, totalResponses: 0 }),
        buildQuizAudienceSlices({ anonymousCompletedCount: 0, identifiedCompletedCount: 0 }),
      ),
    ).toBe(false);
    expect(
      shouldShowQuizDetailCharts(
        buildQuizFunnelSteps({ totalOpenCount: 1, totalStarted: 0, totalResponses: 0 }),
        buildQuizAudienceSlices({ anonymousCompletedCount: 0, identifiedCompletedCount: 0 }),
      ),
    ).toBe(true);
  });
});

