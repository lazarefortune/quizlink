import { describe, expect, it } from "vitest";

import {
  buildLegacyDashboardQuizPreviewPath,
  buildQuizPreviewAbsoluteUrl,
  buildQuizPreviewPath,
  resolveLegacyDashboardPreviewRedirect,
} from "./quiz-preview-routes";

describe("quiz-preview-routes", () => {
  it("builds immersive preview path", () => {
    expect(buildQuizPreviewPath("abc-123")).toBe("/preview/quiz/abc-123");
  });

  it("redirects legacy dashboard preview to immersive route", () => {
    expect(resolveLegacyDashboardPreviewRedirect("abc-123")).toBe(
      "/preview/quiz/abc-123",
    );
  });

  it("preserves query params on legacy redirect", () => {
    expect(
      resolveLegacyDashboardPreviewRedirect("abc-123", {
        tab: "questions",
        debug: "1",
      }),
    ).toBe("/preview/quiz/abc-123?tab=questions&debug=1");
  });

  it("keeps legacy dashboard path helper for compatibility checks", () => {
    expect(buildLegacyDashboardQuizPreviewPath("x")).toBe("/dashboard/quiz/x/preview");
  });

  it("builds absolute preview URL from origin", () => {
    expect(buildQuizPreviewAbsoluteUrl("abc", "https://app.test")).toBe(
      "https://app.test/preview/quiz/abc",
    );
  });
});
