import { describe, expect, it } from "vitest";

import {
  computeAdminLinkResponseCounts,
  sumAdminQuizResponseCounts,
} from "./admin-quiz-response-counts";

describe("computeAdminLinkResponseCounts", () => {
  it("uses only aggregated anonymous completions for public links", () => {
    expect(
      computeAdminLinkResponseCounts({
        participantId: null,
        anonymousCompletedCount: 485,
        identifiedCompletedCount: 999,
      })
    ).toEqual({
      anonymousResponsesCount: 485,
      identifiedResponsesCount: 0,
      totalResponsesCount: 485,
    });
  });

  it("uses only identified completed count for participant links", () => {
    expect(
      computeAdminLinkResponseCounts({
        participantId: "p1",
        anonymousCompletedCount: 50,
        identifiedCompletedCount: 12,
      })
    ).toEqual({
      anonymousResponsesCount: 0,
      identifiedResponsesCount: 12,
      totalResponsesCount: 12,
    });
  });

  it("treats missing anonymous aggregate as zero", () => {
    expect(
      computeAdminLinkResponseCounts({
        participantId: null,
        anonymousCompletedCount: 0,
        identifiedCompletedCount: 0,
      })
    ).toEqual({
      anonymousResponsesCount: 0,
      identifiedResponsesCount: 0,
      totalResponsesCount: 0,
    });
  });
});

describe("sumAdminQuizResponseCounts", () => {
  it("sums anonymous and identified across links", () => {
    expect(
      sumAdminQuizResponseCounts([
        {
          anonymousResponsesCount: 3,
          identifiedResponsesCount: 0,
          totalResponsesCount: 3,
        },
        {
          anonymousResponsesCount: 0,
          identifiedResponsesCount: 7,
          totalResponsesCount: 7,
        },
      ])
    ).toEqual({
      anonymousResponsesCount: 3,
      identifiedResponsesCount: 7,
      totalResponsesCount: 10,
    });
  });
});
