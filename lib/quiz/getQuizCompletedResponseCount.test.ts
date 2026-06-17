import { beforeEach, describe, expect, it, vi } from "vitest";

const mockBatchResolveQuizCompletedCounts = vi.fn();

vi.mock("./batchResolveQuizCompletedCounts", () => ({
  batchResolveQuizCompletedCounts: (...args: unknown[]) =>
    mockBatchResolveQuizCompletedCounts(...args),
}));

import { getQuizCompletedResponseCount } from "./getQuizCompletedResponseCount";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getQuizCompletedResponseCount", () => {
  it("returns aggregate count from batch helper", async () => {
    mockBatchResolveQuizCompletedCounts.mockResolvedValue(
      new Map([["quiz-1", 12]]),
    );

    const count = await getQuizCompletedResponseCount("quiz-1");

    expect(mockBatchResolveQuizCompletedCounts).toHaveBeenCalledWith(["quiz-1"]);
    expect(count).toBe(12);
  });

  it("returns zero when quiz is missing from the batch map", async () => {
    mockBatchResolveQuizCompletedCounts.mockResolvedValue(new Map());

    const count = await getQuizCompletedResponseCount("quiz-2");

    expect(count).toBe(0);
  });
});
