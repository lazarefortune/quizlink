import { describe, expect, it } from "vitest";

import {
  computeExpiredQuizDetailsPurgeEligibility,
  type QuizDetailsPurgeEligibilityInput,
} from "./computeExpiredQuizDetailsPurgePlan";

const now = new Date("2026-05-26T10:00:00.000Z");
const graceDays = 30;

function baseInput(overrides: Partial<QuizDetailsPurgeEligibilityInput>): QuizDetailsPurgeEligibilityInput {
  return {
    quizId: "quiz-1",
    quizTitle: "Quiz 1",
    ownerId: "owner-1",
    quizLinkId: "link-1",
    acceptingResponsesUntil: new Date("2026-04-01T00:00:00.000Z"), // 55 days before `now`
    detailsPurgedAt: null,
    unlockedUntil: null,
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

describe("computeExpiredQuizDetailsPurgeEligibility", () => {
  it("lien gratuit expiré depuis 30+ jours → éligible", () => {
    const input = baseInput({
      acceptingResponsesUntil: new Date("2026-04-01T00:00:00.000Z"),
      ownerProActive: false,
      quizUnlockActive: false,
      unlockedUntil: null,
    });

    const result = computeExpiredQuizDetailsPurgeEligibility(input);
    expect(result.eligible).toBe(true);
    if (!result.eligible) return;
    expect(result.counts.answersEligible).toBe(5);
  });

  it("lien expiré depuis moins de 30 jours → non éligible", () => {
    const input = baseInput({
      acceptingResponsesUntil: new Date("2026-04-28T00:00:00.000Z"), // purgeEligibleAt = 2026-05-28 >= now
      counts: {
        attemptsEligible: 2,
        answersEligible: 5,
        participantNamesEligible: 1,
        participantEmailsEligible: 1,
        attemptsAlreadyPurgedOrNoAnswers: 0,
      },
    });

    const result = computeExpiredQuizDetailsPurgeEligibility(input);
    expect(result.eligible).toBe(false);
    if (result.eligible) return;
    expect(result.skipReason).toBe("not_expired");
  });

  it("quiz avec unlock actif → non éligible", () => {
    const input = baseInput({ quizUnlockActive: true });
    const result = computeExpiredQuizDetailsPurgeEligibility(input);
    expect(result.eligible).toBe(false);
    if (result.eligible) return;
    expect(result.skipReason).toBe("quiz_unlock_active");
  });

  it("owner Pro actif → non éligible", () => {
    const input = baseInput({ ownerProActive: true });
    const result = computeExpiredQuizDetailsPurgeEligibility(input);
    expect(result.eligible).toBe(false);
    if (result.eligible) return;
    expect(result.skipReason).toBe("owner_pro_active");
  });

  it("lien sans acceptingResponsesUntil → non éligible", () => {
    const input = baseInput({ acceptingResponsesUntil: null });
    const result = computeExpiredQuizDetailsPurgeEligibility(input);
    expect(result.eligible).toBe(false);
    if (result.eligible) return;
    expect(result.skipReason).toBe("missing_accepting_responses_until");
  });

  it("detailsPurgedAt déjà rempli → non éligible", () => {
    const input = baseInput({ detailsPurgedAt: new Date("2026-01-01T00:00:00.000Z") });
    const result = computeExpiredQuizDetailsPurgeEligibility(input);
    expect(result.eligible).toBe(false);
    if (result.eligible) return;
    expect(result.skipReason).toBe("details_already_purged");
  });

  it("unlockedUntil mirror actif → non éligible", () => {
    const input = baseInput({
      acceptingResponsesUntil: new Date("2026-04-01T00:00:00.000Z"), // expired enough
      unlockedUntil: new Date("2026-05-27T00:00:00.000Z"),
    });

    const result = computeExpiredQuizDetailsPurgeEligibility(input);
    expect(result.eligible).toBe(false);
    if (result.eligible) return;
    expect(result.skipReason).toBe("unlocked_until_guard_active");
  });

  it("compte answers / names / emails → inclus uniquement si éligible", () => {
    const input = baseInput({
      counts: {
        attemptsEligible: 10,
        answersEligible: 42,
        participantNamesEligible: 7,
        participantEmailsEligible: 3,
        attemptsAlreadyPurgedOrNoAnswers: 2,
      },
    });

    const result = computeExpiredQuizDetailsPurgeEligibility(input);
    expect(result.eligible).toBe(true);
    if (!result.eligible) return;
    expect(result.counts).toEqual(input.counts);
  });
});

