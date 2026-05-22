import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockCookieDelete = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: vi.fn(),
    get: vi.fn(),
    delete: (...args: unknown[]) => mockCookieDelete(...args),
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quizAttempt: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

import { abandonQuizAttemptById } from "@/lib/quiz/abandon-quiz-attempt";
import { abandonQuizAttemptAction } from "./anonymous-attempt-actions";

const startedAt = new Date("2026-05-20T10:00:00Z");

describe("abandonQuizAttemptById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
  });

  it("marks IN_PROGRESS attempt as ABANDONED with durationSeconds", async () => {
    mockFindUnique.mockResolvedValue({
      id: "att-1",
      status: "IN_PROGRESS",
      startedAt,
    });

    const result = await abandonQuizAttemptById("att-1");

    expect(result).toEqual({ success: true, alreadyFinalized: false });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "att-1" },
      data: expect.objectContaining({
        status: "ABANDONED",
        finishedAt: expect.any(Date),
        durationSeconds: expect.any(Number),
      }),
    });
  });

  it("is idempotent when attempt is already COMPLETED", async () => {
    mockFindUnique.mockResolvedValue({
      id: "att-1",
      status: "COMPLETED",
      startedAt,
    });

    const result = await abandonQuizAttemptById("att-1");

    expect(result).toEqual({ success: true, alreadyFinalized: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("is idempotent when attempt is already ABANDONED", async () => {
    mockFindUnique.mockResolvedValue({
      id: "att-1",
      status: "ABANDONED",
      startedAt,
    });

    const result = await abandonQuizAttemptById("att-1");

    expect(result).toEqual({ success: true, alreadyFinalized: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns error when attempt is not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await abandonQuizAttemptById("missing");

    expect(result).toEqual({ success: false, error: "Attempt not found" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("abandonQuizAttemptAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
  });

  it("delegates to abandonQuizAttemptById and clears cookie", async () => {
    mockFindUnique.mockImplementation((args: { select?: unknown }) => {
      if (args && typeof args === "object" && "select" in args) {
        const select = args.select as { quizLink?: unknown };
        if (select.quizLink) {
          return Promise.resolve({ quizLink: { token: "tok" } });
        }
      }
      return Promise.resolve({
        id: "att-1",
        status: "IN_PROGRESS",
        startedAt,
      });
    });

    const result = await abandonQuizAttemptAction("att-1");
    expect(result).toEqual({ success: true });
    expect(mockCookieDelete).toHaveBeenCalled();
  });
});
