import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindEligibleAttemptIds = vi.fn();
const mockPurgeQuizLinkDetailedResponses = vi.fn();

vi.mock("../lib/quiz/purgeExpiredQuizDetails", () => ({
  findEligibleAttemptIdsForQuizLink: (...args: unknown[]) =>
    mockFindEligibleAttemptIds(...args),
  purgeQuizLinkDetailedResponses: (...args: unknown[]) =>
    mockPurgeQuizLinkDetailedResponses(...args),
}));

import type { ExpiredQuizDetailsPurgePlanSummary } from "../lib/quiz/computeExpiredQuizDetailsPurgePlan";
import {
  applyExpiredQuizDetailsPurgePlan,
  parsePurgeExpiredQuizDetailsOptions,
} from "./dry-run-purge-expired-quiz-details";

const basePlan: ExpiredQuizDetailsPurgePlanSummary = {
  quizzesScanned: 1,
  quizzesEligible: 1,
  linksScanned: 1,
  linksEligible: 1,
  linksSkippedPro: 0,
  linksSkippedUnlock: 0,
  linksSkippedNotExpired: 0,
  attemptsEligible: 2,
  answersEligible: 5,
  participantNamesEligible: 1,
  participantEmailsEligible: 1,
  attemptsAlreadyPurgedOrNoAnswers: 0,
  eligibleEntries: [
    {
      quizId: "quiz-1",
      quizTitle: "Quiz 1",
      ownerId: "owner-1",
      quizLinkId: "link-1",
      acceptingResponsesUntil: new Date("2026-04-01T00:00:00.000Z"),
      purgeEligibleAt: new Date("2026-05-01T00:00:00.000Z"),
      counts: {
        attemptsEligible: 2,
        answersEligible: 5,
        participantNamesEligible: 1,
        participantEmailsEligible: 1,
        attemptsAlreadyPurgedOrNoAnswers: 0,
      },
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFindEligibleAttemptIds.mockResolvedValue(["att-1", "att-2"]);
  mockPurgeQuizLinkDetailedResponses.mockResolvedValue({
    answersDeleted: 5,
    attemptsAnonymized: 2,
    participantNamesCleared: 1,
    participantEmailsCleared: 1,
    detailsPurgedAt: new Date("2026-05-26T10:00:00.000Z"),
  });
});

describe("parsePurgeExpiredQuizDetailsOptions", () => {
  it("refuses execution when neither --dry-run nor --apply is provided", () => {
    expect(() => parsePurgeExpiredQuizDetailsOptions([])).toThrow(
      /Fournissez --dry-run ou --apply/,
    );
  });

  it("refuses --dry-run and --apply together", () => {
    expect(() =>
      parsePurgeExpiredQuizDetailsOptions(["--dry-run", "--apply"]),
    ).toThrow(/mutuellement exclusifs/);
  });

  it("refuses --apply without --quizId or --allowGlobalApply", () => {
    expect(() => parsePurgeExpiredQuizDetailsOptions(["--apply"])).toThrow(
      /--quizId=xxx ou --allowGlobalApply/,
    );
  });

  it("refuses --allowGlobalApply without --apply", () => {
    expect(() =>
      parsePurgeExpiredQuizDetailsOptions(["--allowGlobalApply"]),
    ).toThrow(/--allowGlobalApply ne fonctionne qu'avec --apply/);
  });

  it("accepts --dry-run", () => {
    expect(
      parsePurgeExpiredQuizDetailsOptions(["--dry-run", "--quizId=quiz-1"]),
    ).toEqual({
      mode: "dry-run",
      quizId: "quiz-1",
      batchSize: 100,
      verbose: false,
      allowGlobalApply: false,
    });
  });

  it("accepts --apply --quizId", () => {
    expect(
      parsePurgeExpiredQuizDetailsOptions(["--apply", "--quizId=quiz-1"]),
    ).toEqual({
      mode: "apply",
      quizId: "quiz-1",
      batchSize: 100,
      verbose: false,
      allowGlobalApply: false,
    });
  });

  it("accepts --apply --allowGlobalApply", () => {
    expect(
      parsePurgeExpiredQuizDetailsOptions(["--apply", "--allowGlobalApply"]),
    ).toEqual({
      mode: "apply",
      quizId: undefined,
      batchSize: 100,
      verbose: false,
      allowGlobalApply: true,
    });
  });
});

describe("applyExpiredQuizDetailsPurgePlan", () => {
  it("purges each eligible entry from the plan", async () => {
    const summary = await applyExpiredQuizDetailsPurgePlan(basePlan);

    expect(mockFindEligibleAttemptIds).toHaveBeenCalledWith("link-1");
    expect(mockPurgeQuizLinkDetailedResponses).toHaveBeenCalledWith(
      "link-1",
      ["att-1", "att-2"],
      expect.any(Date),
    );
    expect(summary).toEqual({
      linksPurged: 1,
      attemptsAnonymized: 2,
      answersDeleted: 5,
      participantNamesCleared: 1,
      participantEmailsCleared: 1,
    });
  });

  it("does not count links when detailsPurgedAt was already set", async () => {
    mockPurgeQuizLinkDetailedResponses.mockResolvedValue({
      answersDeleted: 0,
      attemptsAnonymized: 0,
      participantNamesCleared: 0,
      participantEmailsCleared: 0,
      detailsPurgedAt: null,
    });

    const summary = await applyExpiredQuizDetailsPurgePlan(basePlan);

    expect(summary.linksPurged).toBe(0);
  });
});
