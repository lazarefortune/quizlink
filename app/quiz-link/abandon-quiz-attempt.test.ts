import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindUnique = vi.fn();
const mockUpdateMany = vi.fn();
const mockCookieDelete = vi.fn();
const mockTransitionAttemptToAbandoned = vi.fn();
const mockIncrementQuizAbandonedAggregate = vi.fn();
const mockQuizLinkUpdate = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: vi.fn(),
    get: vi.fn(),
    delete: (...args: unknown[]) => mockCookieDelete(...args),
  })),
}));

vi.mock("@/lib/quiz/quiz-response-aggregates", () => ({
  transitionAttemptToAbandoned: (...args: unknown[]) =>
    mockTransitionAttemptToAbandoned(...args),
  incrementQuizAbandonedAggregate: (...args: unknown[]) =>
    mockIncrementQuizAbandonedAggregate(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quizAttempt: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
    },
    quizLink: {
      update: (...args: unknown[]) => mockQuizLinkUpdate(...args),
    },
  },
}));

import { abandonQuizAttemptById } from "@/lib/quiz/abandon-quiz-attempt";
import { abandonQuizAttemptAction } from "./anonymous-attempt-actions";

const startedAt = new Date("2026-05-20T10:00:00Z");

describe("abandonQuizAttemptById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransitionAttemptToAbandoned.mockResolvedValue(true);
    mockIncrementQuizAbandonedAggregate.mockResolvedValue(undefined);
    mockQuizLinkUpdate.mockResolvedValue({});
  });

  it("marks IN_PROGRESS attempt as ABANDONED with durationSeconds", async () => {
    mockFindUnique.mockResolvedValue({
      id: "att-1",
      status: "IN_PROGRESS",
      startedAt,
      quizLinkId: "link-1",
      quizLink: { quizId: "quiz-1" },
    });

    const result = await abandonQuizAttemptById("att-1");

    expect(result).toEqual({ success: true, alreadyFinalized: false });
    expect(mockTransitionAttemptToAbandoned).toHaveBeenCalledWith(
      "att-1",
      expect.objectContaining({
        finishedAt: expect.any(Date),
        durationSeconds: expect.any(Number),
      }),
    );
    expect(mockIncrementQuizAbandonedAggregate).toHaveBeenCalledWith("quiz-1");
  });

  it("is idempotent when attempt is already COMPLETED", async () => {
    mockFindUnique.mockResolvedValue({
      id: "att-1",
      status: "COMPLETED",
      startedAt,
      quizLinkId: "link-1",
      quizLink: { quizId: "quiz-1" },
    });

    const result = await abandonQuizAttemptById("att-1");

    expect(result).toEqual({ success: true, alreadyFinalized: true });
    expect(mockTransitionAttemptToAbandoned).not.toHaveBeenCalled();
    expect(mockIncrementQuizAbandonedAggregate).not.toHaveBeenCalled();
  });

  it("is idempotent when attempt is already ABANDONED", async () => {
    mockFindUnique.mockResolvedValue({
      id: "att-1",
      status: "ABANDONED",
      startedAt,
      quizLinkId: "link-1",
      quizLink: { quizId: "quiz-1" },
    });

    const result = await abandonQuizAttemptById("att-1");

    expect(result).toEqual({ success: true, alreadyFinalized: true });
    expect(mockTransitionAttemptToAbandoned).not.toHaveBeenCalled();
    expect(mockIncrementQuizAbandonedAggregate).not.toHaveBeenCalled();
  });

  it("does not double-count when transition fails", async () => {
    mockFindUnique.mockResolvedValue({
      id: "att-1",
      status: "IN_PROGRESS",
      startedAt,
      quizLinkId: "link-1",
      quizLink: { quizId: "quiz-1" },
    });
    mockTransitionAttemptToAbandoned.mockResolvedValue(false);

    const result = await abandonQuizAttemptById("att-1");

    expect(result).toEqual({ success: true, alreadyFinalized: true });
    expect(mockIncrementQuizAbandonedAggregate).not.toHaveBeenCalled();
  });

  it("returns error when attempt is not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await abandonQuizAttemptById("missing");

    expect(result).toEqual({ success: false, error: "Attempt not found" });
    expect(mockTransitionAttemptToAbandoned).not.toHaveBeenCalled();
  });
});

describe("abandonQuizAttemptAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransitionAttemptToAbandoned.mockResolvedValue(true);
    mockIncrementQuizAbandonedAggregate.mockResolvedValue(undefined);
    mockQuizLinkUpdate.mockResolvedValue({});
  });

  it("delegates to abandonQuizAttemptById and clears cookie", async () => {
    mockFindUnique.mockImplementation((args: { select?: unknown }) => {
      if (args && typeof args === "object" && "select" in args) {
        const select = args.select as { quizLink?: unknown; status?: unknown };
        if (select.quizLink && !select.status) {
          return Promise.resolve({ quizLink: { token: "tok" } });
        }
      }
      return Promise.resolve({
        id: "att-1",
        status: "IN_PROGRESS",
        startedAt,
        quizLinkId: "link-1",
        quizLink: { quizId: "quiz-1" },
      });
    });

    const result = await abandonQuizAttemptAction("att-1");
    expect(result).toEqual({ success: true });
    expect(mockCookieDelete).toHaveBeenCalled();
  });
});
