import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("anonymous play page cookie flow", () => {
  const pageSource = readFileSync(
    join(process.cwd(), "app/quiz/[token]/play/page.tsx"),
    "utf8",
  );

  it("does not trust attemptId from URL for anonymous flow", () => {
    expect(pageSource).toContain("getAnonymousQuizAttemptCookie(token)");
    expect(pageSource).toContain("validateAnonymousPlayAttempt(token, cookieAttemptId)");
  });

  it("shows completed and abandoned guards after cookie validation", () => {
    expect(pageSource).toContain('resolution.status === "completed"');
    expect(pageSource).toContain('resolution.status === "abandoned"');
  });
});
