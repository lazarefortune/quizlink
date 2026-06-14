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
  ensureQuizLinkResponseActivityStarted,
  touchQuizLinkLastResponseAt,
} from "./quizLinkActivityPersistence";

const now = new Date("2026-05-22T12:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateMany.mockResolvedValue({ count: 1 });
  mockUpdate.mockResolvedValue({});
});

describe("quizLinkActivityPersistence", () => {
  it("ensureQuizLinkResponseActivityStarted only sets responsesStartedAt", async () => {
    await ensureQuizLinkResponseActivityStarted("link-1", now);

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: "link-1", responsesStartedAt: null },
      data: {
        responsesStartedAt: now,
      },
    });
    expect(mockUpdateMany.mock.calls[0]?.[0]?.data).not.toHaveProperty(
      "acceptingResponsesUntil",
    );
    expect(mockUpdateMany.mock.calls[0]?.[0]?.data).not.toHaveProperty(
      "detailsVisibleUntil",
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
