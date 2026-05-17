import { describe, expect, it } from "vitest";

import { isQuizDetailTab, parseQuizDetailTab } from "./parse-quiz-detail-tab";

describe("parseQuizDetailTab", () => {
  it("returns questions or results for valid values", () => {
    expect(parseQuizDetailTab("questions")).toBe("questions");
    expect(parseQuizDetailTab("results")).toBe("results");
  });

  it("defaults to questions for invalid or missing values", () => {
    expect(parseQuizDetailTab(null)).toBe("questions");
    expect(parseQuizDetailTab(undefined)).toBe("questions");
    expect(parseQuizDetailTab("invalid")).toBe("questions");
  });

  it("narrows valid tab values", () => {
    expect(isQuizDetailTab("results")).toBe(true);
    expect(isQuizDetailTab("foo")).toBe(false);
  });
});
