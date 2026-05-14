import { describe, it, expect } from "vitest";

import { QUIZ_ACTION_ERROR_CODE } from "@/lib/quiz/quizActionErrorCodes";

import { resolveQuizActionError } from "./resolveQuizActionError";

describe("resolveQuizActionError", () => {
  it("maps PLAY_DRAFT to French copy", () => {
    expect(resolveQuizActionError("fr", QUIZ_ACTION_ERROR_CODE.PLAY_DRAFT)).toBe(
      "Ce quiz n’est pas encore disponible.",
    );
  });

  it("maps MAKE_PUBLIC_REQUIRES_ACTIVE to English copy", () => {
    expect(
      resolveQuizActionError("en", QUIZ_ACTION_ERROR_CODE.MAKE_PUBLIC_REQUIRES_ACTIVE),
    ).toBe("Finish the quiz before making it public.");
  });

  it("returns unknown errors unchanged", () => {
    expect(resolveQuizActionError("en", "Some raw message")).toBe("Some raw message");
  });
});
