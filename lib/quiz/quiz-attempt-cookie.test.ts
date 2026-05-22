import { describe, expect, it } from "vitest";

import {
  QUIZ_ATTEMPT_COOKIE_MAX_AGE_SECONDS,
  buildQuizAttemptCookieName,
  buildQuizAttemptCookieOptions,
  buildQuizAttemptCookiePath,
} from "./quiz-attempt-cookie";

describe("quiz-attempt-cookie", () => {
  it("builds a stable cookie name for simple tokens", () => {
    expect(buildQuizAttemptCookieName("abc-token_1")).toBe(
      "quizlink_attempt_abc-token_1",
    );
  });

  it("hashes long or unsafe tokens for cookie name", () => {
    const name = buildQuizAttemptCookieName("a".repeat(100));
    expect(name.startsWith("quizlink_attempt_")).toBe(true);
    expect(name).not.toContain("a".repeat(50));
  });

  it("scopes cookie path to the quiz token", () => {
    expect(buildQuizAttemptCookiePath("tok/en")).toBe("/quiz/tok%2Fen");
  });

  it("sets httpOnly lax cookie options with max age", () => {
    const options = buildQuizAttemptCookieOptions("tok");
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.maxAge).toBe(QUIZ_ATTEMPT_COOKIE_MAX_AGE_SECONDS);
    expect(options.path).toBe("/quiz/tok");
  });
});
