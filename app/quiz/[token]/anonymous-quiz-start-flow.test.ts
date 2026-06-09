import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the anonymous play funnel: one QuizAttempt per "Commencer",
 * attemptId in httpOnly cookie (not URL).
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
  const actionsSource = readFileSync(
    join(process.cwd(), "app/quiz-link/anonymous-attempt-actions.ts"),
    "utf8",
  );

  it("creates the attempt on Commencer and redirects without attemptId in URL", () => {
    expect(introSource).toContain("startAnonymousQuizAttemptAction(token,");
    expect(introSource).toContain("saveParticipantLocalProfile");
    expect(introSource).toContain("router.push(attemptResult.redirectTo)");
    expect(introSource).not.toContain("recordAnonymousQuizStart(token)");
  });

  it("start action sets httpOnly cookie server-side", () => {
    expect(actionsSource).toContain("setAnonymousQuizAttemptCookie");
    expect(actionsSource).toContain("redirectTo: `/quiz/${trimmedToken}/play`");
  });

  it("does not create a new attempt when the play page mounts", () => {
    expect(playSource).not.toContain("startAnonymousQuizAttemptAction");
    expect(playSource).toContain("attemptId: initialAttemptId");
  });

  it("calls abandonQuizAttemptAction when the player confirms quit", () => {
    expect(playSource).toContain("abandonQuizAttemptAction(attemptId)");
    expect(playSource).not.toContain("startAnonymousQuizAttemptAction");
  });

  it("play page reads attemptId from cookie and redirects without cookie", () => {
    expect(pageSource).toContain("getAnonymousQuizAttemptCookie(token)");
    expect(pageSource).toContain("redirect(`/quiz/${token}`)");
    expect(pageSource).toContain("redirect(`/quiz/${token}/play`)");
    expect(pageSource).toContain("validateAnonymousPlayAttempt");
  });

  it("legacy query attemptId redirects to clean play URL when valid", () => {
    expect(pageSource).toContain("setAnonymousQuizAttemptCookie(token, legacyResolution.attemptId)");
    expect(pageSource).toContain("redirect(`/quiz/${token}/play`)");
  });
});
