import { describe, expect, it } from "vitest";

import { FREE_QUIZ_RESPONSE_LIMIT } from "./quizUnlockConstants";
import {
  computeExpiredQuizDetailsPurgeEligibility,
  computePurgeEligibleAt,
  resolveQuizLinkLastActivityAt,
  type QuizDetailsPurgeEligibilityInput,
} from "./computeExpiredQuizDetailsPurgePlan";

const now = new Date("2026-05-26T10:00:00.000Z");
const graceDays = 30;
const freeLimit = FREE_QUIZ_RESPONSE_LIMIT;

function daysFromNow(days: number): Date {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

function baseInput(
  overrides: Partial<QuizDetailsPurgeEligibilityInput>,
): QuizDetailsPurgeEligibilityInput {
  return {
    quizId: "quiz-1",
    quizTitle: "Quiz 1",
    ownerId: "owner-1",
    quizLinkId: "link-1",
    completedResponses: 20,
    freeLimit,
    lastActivityAt: daysFromNow(-45),
    detailsPurgedAt: null,
    now,
    graceDays,
    ownerProActive: false,
    quizUnlockActive: false,
    counts: {
      attemptsEligible: 2,
      answersEligible: 5,
      participantNamesEligible: 1,
      participantEmailsEligible: 1,
      attemptsAlreadyPurgedOrNoAnswers: 0,
    },
    ...overrides,
  };
}

describe("resolveQuizLinkLastActivityAt", () => {
  it("prefers lastResponseAt over attempt timestamps", () => {
    const lastResponseAt = daysFromNow(-10);
    expect(
      resolveQuizLinkLastActivityAt({
        lastResponseAt,
        latestAttemptFinishedAt: daysFromNow(-20),
        latestAttemptStartedAt: daysFromNow(-25),
      }),
    ).toEqual(lastResponseAt);
  });

  it("falls back to latest finishedAt then startedAt", () => {
    const finishedAt = daysFromNow(-15);
    const startedAt = daysFromNow(-20);

    expect(
      resolveQuizLinkLastActivityAt({
        lastResponseAt: null,
        latestAttemptFinishedAt: finishedAt,
        latestAttemptStartedAt: startedAt,
      }),
    ).toEqual(finishedAt);

    expect(
      resolveQuizLinkLastActivityAt({
        lastResponseAt: null,
        latestAttemptFinishedAt: null,
        latestAttemptStartedAt: startedAt,
      }),
    ).toEqual(startedAt);
  });

  it("returns null when no activity exists", () => {
    expect(
      resolveQuizLinkLastActivityAt({
        lastResponseAt: null,
        latestAttemptFinishedAt: null,
        latestAttemptStartedAt: null,
      }),
    ).toBeNull();
  });
});

describe("computeExpiredQuizDetailsPurgeEligibility", () => {
  it("quiz gratuit avec 19 COMPLETED → non éligible", () => {
    const result = computeExpiredQuizDetailsPurgeEligibility(
      baseInput({ completedResponses: 19 }),
    );
    expect(result.eligible).toBe(false);
    if (result.eligible) return;
    expect(result.skipReason).toBe("free_limit_not_reached");
  });

  it("quiz gratuit avec 20 COMPLETED mais activité récente → non éligible", () => {
    const result = computeExpiredQuizDetailsPurgeEligibility(
      baseInput({
        completedResponses: 20,
        lastActivityAt: daysFromNow(-5),
      }),
    );
    expect(result.eligible).toBe(false);
    if (result.eligible) return;
    expect(result.skipReason).toBe("within_grace_period");
  });

  it("quiz gratuit avec 20 COMPLETED et dernière activité > 30 jours → éligible", () => {
    const lastActivityAt = daysFromNow(-45);
    const result = computeExpiredQuizDetailsPurgeEligibility(
      baseInput({
        completedResponses: 20,
        lastActivityAt,
      }),
    );
    expect(result.eligible).toBe(true);
    if (!result.eligible) return;
    expect(result.purgeEligibleAt).toEqual(computePurgeEligibleAt(lastActivityAt, graceDays));
  });

  it("quiz gratuit avec 25 COMPLETED → éligible si activité ancienne", () => {
    const result = computeExpiredQuizDetailsPurgeEligibility(
      baseInput({ completedResponses: 25 }),
    );
    expect(result.eligible).toBe(true);
  });

  it("20 ABANDONED et 0 COMPLETED → non éligible", () => {
    const result = computeExpiredQuizDetailsPurgeEligibility(
      baseInput({ completedResponses: 0 }),
    );
    expect(result.eligible).toBe(false);
    if (result.eligible) return;
    expect(result.skipReason).toBe("free_limit_not_reached");
  });

  it("owner Pro actif → non éligible", () => {
    const result = computeExpiredQuizDetailsPurgeEligibility(
      baseInput({ ownerProActive: true }),
    );
    expect(result.eligible).toBe(false);
    if (result.eligible) return;
    expect(result.skipReason).toBe("pro_active");
  });

  it("unlock coins permanent → non éligible", () => {
    const result = computeExpiredQuizDetailsPurgeEligibility(
      baseInput({ quizUnlockActive: true }),
    );
    expect(result.eligible).toBe(false);
    if (result.eligible) return;
    expect(result.skipReason).toBe("unlock_active");
  });

  it("detailsPurgedAt déjà rempli → non éligible", () => {
    const result = computeExpiredQuizDetailsPurgeEligibility(
      baseInput({ detailsPurgedAt: daysFromNow(-1) }),
    );
    expect(result.eligible).toBe(false);
    if (result.eligible) return;
    expect(result.skipReason).toBe("already_purged");
  });

  it("quiz sans activité → non éligible", () => {
    const result = computeExpiredQuizDetailsPurgeEligibility(
      baseInput({ lastActivityAt: null }),
    );
    expect(result.eligible).toBe(false);
    if (result.eligible) return;
    expect(result.skipReason).toBe("no_recent_activity");
  });

  it("compte answers / names / emails → inclus uniquement si éligible", () => {
    const counts = {
      attemptsEligible: 10,
      answersEligible: 42,
      participantNamesEligible: 7,
      participantEmailsEligible: 3,
      attemptsAlreadyPurgedOrNoAnswers: 2,
    };
    const result = computeExpiredQuizDetailsPurgeEligibility(baseInput({ counts }));
    expect(result.eligible).toBe(true);
    if (!result.eligible) return;
    expect(result.counts).toEqual(counts);
  });

  it("rien à purger → non éligible", () => {
    const result = computeExpiredQuizDetailsPurgeEligibility(
      baseInput({
        counts: {
          attemptsEligible: 0,
          answersEligible: 0,
          participantNamesEligible: 0,
          participantEmailsEligible: 0,
          attemptsAlreadyPurgedOrNoAnswers: 5,
        },
      }),
    );
    expect(result.eligible).toBe(false);
    if (result.eligible) return;
    expect(result.skipReason).toBe("nothing_to_purge");
  });
});
