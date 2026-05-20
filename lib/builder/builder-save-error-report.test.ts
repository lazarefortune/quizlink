import { describe, expect, it } from "vitest";

import { buildBuilderSaveErrorMetadata } from "./builder-save-error-report";

describe("buildBuilderSaveErrorMetadata", () => {
  it("builds required builder save error metadata", () => {
    const metadata = buildBuilderSaveErrorMetadata({
      phase: "manual_save",
      locale: "fr",
      pathname: "/builder/quiz_1",
      savedQuizId: "quiz_1",
      questionCount: 5,
      quizStatus: "DRAFT",
      isDraft: true,
      isActive: false,
    });

    expect(metadata).toEqual({
      source: "builder_save_error",
      phase: "manual_save",
      locale: "fr",
      pathname: "/builder/quiz_1",
      savedQuizId: "quiz_1",
      questionCount: 5,
      quizStatus: "DRAFT",
      isDraft: true,
      isActive: false,
    });
  });

  it("sanitizes error message and strips newlines", () => {
    const metadata = buildBuilderSaveErrorMetadata({
      phase: "autosave",
      locale: "en",
      pathname: "/builder",
      errorMessage: "  Something\nwent wrong  ",
    });

    expect(metadata.errorMessage).toBe("Something went wrong");
  });
});
