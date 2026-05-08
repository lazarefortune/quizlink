import { describe, expect, it } from "vitest";

import {
  USER_QUIZ_DEFAULT_VISIBILITY,
  getUserQuizCreationVisibility,
} from "./user-quiz-visibility";

describe("getUserQuizCreationVisibility", () => {
  it("returns PRIVATE as the safe default for user flows", () => {
    expect(getUserQuizCreationVisibility()).toBe("PRIVATE");
    expect(USER_QUIZ_DEFAULT_VISIBILITY).toBe("PRIVATE");
  });
});
