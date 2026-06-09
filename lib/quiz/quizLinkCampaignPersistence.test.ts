import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUpdateMany = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quizLink: {
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

import {
  ensureQuizLinkCampaignStarted,
  touchQuizLinkLastResponseAt,
} from "./quizLinkCampaignPersistence";

const now = new Date("2026-05-22T12:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateMany.mockResolvedValue({ count: 1 });
  mockUpdate.mockResolvedValue({});
});

describe("quizLinkCampaignPersistence", () => {
  it("ensureQuizLinkCampaignStarted only updates links without responsesStartedAt", async () => {
    await ensureQuizLinkCampaignStarted("link-1", now);

    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "link-1", responsesStartedAt: null },
        data: expect.objectContaining({
          responsesStartedAt: now,
          acceptingResponsesUntil: expect.any(Date),
          detailsVisibleUntil: expect.any(Date),
        }),
      }),
    );
  });

  it("touchQuizLinkLastResponseAt sets lastResponseAt", async () => {
    await touchQuizLinkLastResponseAt("link-1", now);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "link-1" },
      data: { lastResponseAt: now },
    });
  });
});
