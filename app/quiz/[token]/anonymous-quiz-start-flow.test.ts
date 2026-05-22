import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the anonymous play funnel: one QuizAttempt per "Commencer",
 * not a second create on /play mount (React Strict Mode safe).
 */
describe("anonymous quiz start flow", () => {
  const introSource = readFileSync(
    join(process.cwd(), "app/quiz/[token]/quiz-introduction-content.tsx"),
    "utf8",
  );
  const playSource = readFileSync(
    join(process.cwd(), "app/quiz/[token]/play/anonymous-quiz-play-content.tsx"),
    "utf8",
  );
  const pageSource = readFileSync(
    join(process.cwd(), "app/quiz/[token]/play/page.tsx"),
    "utf8",
  );

  it("creates the attempt on Commencer and passes attemptId to play", () => {
    expect(introSource).toContain("startAnonymousQuizAttemptAction(token)");
    expect(introSource).toContain("play?attemptId=${attemptResult.attemptId}");
    expect(introSource).not.toContain("recordAnonymousQuizStart(token)");
  });

  it("does not create a new attempt when the play page mounts", () => {
    expect(playSource).not.toContain("startAnonymousQuizAttemptAction");
    expect(playSource).toContain("attemptId: initialAttemptId");
  });

  it("calls abandonQuizAttemptAction when the player confirms quit", () => {
    expect(playSource).toContain("abandonQuizAttemptAction(attemptId)");
    expect(playSource).not.toContain("startAnonymousQuizAttemptAction");
  });

  it("redirects anonymous /play without attemptId back to the intro", () => {
    expect(pageSource).toContain("redirect(`/quiz/${token}`)");
    expect(pageSource).toContain("attemptId={attemptId}");
  });
});
