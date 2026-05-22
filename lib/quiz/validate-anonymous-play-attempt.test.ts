import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quizAttempt: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

import { validateAnonymousPlayAttempt } from "./validate-anonymous-play-attempt";

const baseAttempt = {
  id: "att-1",
  status: "IN_PROGRESS",
  identityMode: "ANONYMOUS",
  quizLink: {
    token: "tok",
    participantId: null,
    quiz: { status: "ACTIVE" },
  },
};

describe("validateAnonymousPlayAttempt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts in-progress anonymous attempt for matching token", async () => {
    mockFindUnique.mockResolvedValue(baseAttempt);
    const result = await validateAnonymousPlayAttempt("tok", "att-1");
    expect(result).toEqual({ status: "in_progress", attemptId: "att-1" });
  });

  it("rejects token mismatch", async () => {
    mockFindUnique.mockResolvedValue(baseAttempt);
    const result = await validateAnonymousPlayAttempt("other", "att-1");
    expect(result).toEqual({ status: "token_mismatch" });
  });

  it("rejects completed attempts", async () => {
    mockFindUnique.mockResolvedValue({ ...baseAttempt, status: "COMPLETED" });
    const result = await validateAnonymousPlayAttempt("tok", "att-1");
    expect(result).toEqual({ status: "completed" });
  });

  it("rejects abandoned attempts", async () => {
    mockFindUnique.mockResolvedValue({ ...baseAttempt, status: "ABANDONED" });
    const result = await validateAnonymousPlayAttempt("tok", "att-1");
    expect(result).toEqual({ status: "abandoned" });
  });

  it("returns not_found when attempt does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await validateAnonymousPlayAttempt("tok", "missing");
    expect(result).toEqual({ status: "not_found" });
  });
});
