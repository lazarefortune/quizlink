import { describe, it, expect } from "vitest";

import {
  FINALIZE_DRAFT_QUIZ_ERROR_CODE,
  resolveFinalizeDraftQuizError,
} from "./finalizeDraftQuizErrors";

describe("resolveFinalizeDraftQuizError", () => {
  it("maps NOT_OWNER to French copy", () => {
    expect(
      resolveFinalizeDraftQuizError("fr", FINALIZE_DRAFT_QUIZ_ERROR_CODE.NOT_OWNER),
    ).toBe("Tu n’as pas la permission de terminer ce quiz.");
  });

  it("maps NO_QUESTIONS to English copy", () => {
    expect(
      resolveFinalizeDraftQuizError("en", FINALIZE_DRAFT_QUIZ_ERROR_CODE.NO_QUESTIONS),
    ).toBe("Add at least one question before finishing the quiz.");
  });
});
