import { beforeEach, describe, expect, it, vi } from "vitest";

const mockQuizAttemptFindMany = vi.fn();
const mockQuizAttemptCount = vi.fn();
const mockQuizAttemptUpdateMany = vi.fn();
const mockQuizAnswerDeleteMany = vi.fn();
const mockQuizLinkUpdateMany = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quizAttempt: {
      findMany: (...args: unknown[]) => mockQuizAttemptFindMany(...args),
      count: (...args: unknown[]) => mockQuizAttemptCount(...args),
      updateMany: (...args: unknown[]) => mockQuizAttemptUpdateMany(...args),
    },
    quizAnswer: {
      deleteMany: (...args: unknown[]) => mockQuizAnswerDeleteMany(...args),
    },
    quizLink: {
      updateMany: (...args: unknown[]) => mockQuizLinkUpdateMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

import {
  findEligibleAttemptIdsForQuizLink,
  purgeQuizLinkDetailedResponses,
} from "./purgeExpiredQuizDetails";

const now = new Date("2026-05-26T10:00:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
  mockTransaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
    callback({
      quizAttempt: {
        count: (...args: unknown[]) => mockQuizAttemptCount(...args),
        updateMany: (...args: unknown[]) => mockQuizAttemptUpdateMany(...args),
      },
      quizAnswer: {
        deleteMany: (...args: unknown[]) => mockQuizAnswerDeleteMany(...args),
      },
      quizLink: {
        updateMany: (...args: unknown[]) => mockQuizLinkUpdateMany(...args),
      },
    }),
  );
});

describe("findEligibleAttemptIdsForQuizLink", () => {
  it("returns attempt ids with detailed data or personal fields", async () => {
    mockQuizAttemptFindMany.mockResolvedValue([{ id: "att-1" }, { id: "att-2" }]);

    const result = await findEligibleAttemptIdsForQuizLink("link-1");

    expect(result).toEqual(["att-1", "att-2"]);
    expect(mockQuizAttemptFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ quizLinkId: "link-1" }),
      }),
    );
  });
});

describe("purgeQuizLinkDetailedResponses", () => {
  it("deletes answers, anonymizes attempts and sets detailsPurgedAt", async () => {
    mockQuizAttemptCount
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    mockQuizAnswerDeleteMany.mockResolvedValue({ count: 5 });
    mockQuizAttemptUpdateMany.mockResolvedValue({ count: 2 });
    mockQuizLinkUpdateMany.mockResolvedValue({ count: 1 });

    const result = await purgeQuizLinkDetailedResponses(
      "link-1",
      ["att-1", "att-2"],
      now,
    );

    expect(result).toEqual({
      answersDeleted: 5,
      attemptsAnonymized: 2,
      participantNamesCleared: 2,
      participantEmailsCleared: 1,
      detailsPurgedAt: now,
    });

    expect(mockQuizAnswerDeleteMany).toHaveBeenCalledWith({
      where: { attemptId: { in: ["att-1", "att-2"] } },
    });
    expect(mockQuizAttemptUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ["att-1", "att-2"] } },
      data: {
        participantName: null,
        participantEmail: null,
      },
    });
    expect(mockQuizLinkUpdateMany).toHaveBeenCalledWith({
      where: { id: "link-1", detailsPurgedAt: null },
      data: { detailsPurgedAt: now },
    });
    expect(mockQuizAttemptUpdateMany.mock.calls[0]?.[0]?.data).not.toHaveProperty(
      "status",
    );
  });

  it("is idempotent when link was already purged", async () => {
    mockQuizAttemptCount.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    mockQuizAnswerDeleteMany.mockResolvedValue({ count: 0 });
    mockQuizAttemptUpdateMany.mockResolvedValue({ count: 0 });
    mockQuizLinkUpdateMany.mockResolvedValue({ count: 0 });

    const result = await purgeQuizLinkDetailedResponses("link-1", ["att-1"], now);

    expect(result.detailsPurgedAt).toBeNull();
    expect(result.answersDeleted).toBe(0);
  });

  it("does not call deleteMany when no attempt ids are provided", async () => {
    const result = await purgeQuizLinkDetailedResponses("link-1", [], now);

    expect(result).toEqual({
      answersDeleted: 0,
      attemptsAnonymized: 0,
      participantNamesCleared: 0,
      participantEmailsCleared: 0,
      detailsPurgedAt: null,
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
