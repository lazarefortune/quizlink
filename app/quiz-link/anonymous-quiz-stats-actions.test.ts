import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRevalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const mockFindUnique = vi.fn();
const mockExecuteRaw = vi.fn();
const mockQuizAttemptCreate = vi.fn();
const mockQuizAnswerCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quizLink: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    $executeRaw: (...args: unknown[]) => mockExecuteRaw(...args),
    quizAttempt: {
      create: (...args: unknown[]) => mockQuizAttemptCreate(...args),
    },
    quizAnswer: {
      create: (...args: unknown[]) => mockQuizAnswerCreate(...args),
    },
  },
}));

import {
  recordAnonymousLinkOpen,
  recordAnonymousQuizStart,
  recordAnonymousQuizCompletion,
} from "./anonymous-quiz-stats-actions";

const eligibleAnonymousLinkRow = {
  id: "link-1",
  quizId: "quiz-1",
  participantId: null as string | null,
  revokedAt: null as Date | null,
  expiresAt: null as Date | null,
};

describe("anonymous-quiz-stats-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecuteRaw.mockResolvedValue(1);
  });

  it("revalidates the quiz results page after a successful write", async () => {
    mockFindUnique.mockResolvedValue(eligibleAnonymousLinkRow);

    await recordAnonymousLinkOpen("tok");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/quiz/quiz-1", "page");
  });

  it("refuses participant links and does not write stats or attempts", async () => {
    mockFindUnique.mockResolvedValue({
      ...eligibleAnonymousLinkRow,
      participantId: "participant-1",
    });

    const openResult = await recordAnonymousLinkOpen("tok");
    expect(openResult.success).toBe(false);
    expect(mockExecuteRaw).not.toHaveBeenCalled();
    expect(mockQuizAttemptCreate).not.toHaveBeenCalled();
    expect(mockQuizAnswerCreate).not.toHaveBeenCalled();

    const startResult = await recordAnonymousQuizStart("tok");
    expect(startResult.success).toBe(false);
    expect(mockExecuteRaw).not.toHaveBeenCalled();

    const doneResult = await recordAnonymousQuizCompletion("tok", 80);
    expect(doneResult.success).toBe(false);
    expect(mockExecuteRaw).not.toHaveBeenCalled();
  });

  it("records link open with a single executeRaw for public links", async () => {
    mockFindUnique.mockResolvedValue(eligibleAnonymousLinkRow);

    const result = await recordAnonymousLinkOpen("tok");

    expect(result.success).toBe(true);
    expect(mockExecuteRaw).toHaveBeenCalledTimes(1);
    expect(mockQuizAttemptCreate).not.toHaveBeenCalled();
    expect(mockQuizAnswerCreate).not.toHaveBeenCalled();
  });

  it("records quiz start with executeRaw for public links", async () => {
    mockFindUnique.mockResolvedValue(eligibleAnonymousLinkRow);

    const result = await recordAnonymousQuizStart("tok");

    expect(result.success).toBe(true);
    expect(mockExecuteRaw).toHaveBeenCalledTimes(1);
    expect(mockQuizAttemptCreate).not.toHaveBeenCalled();
  });

  it("records completion with executeRaw and rejects invalid scores without querying the link", async () => {
    const bad = await recordAnonymousQuizCompletion("tok", Number.NaN);
    expect(bad.success).toBe(false);
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockExecuteRaw).not.toHaveBeenCalled();

    mockFindUnique.mockResolvedValue(eligibleAnonymousLinkRow);
    const ok = await recordAnonymousQuizCompletion("tok", 66.5);
    expect(ok.success).toBe(true);
    expect(mockExecuteRaw).toHaveBeenCalledTimes(1);
    expect(mockQuizAttemptCreate).not.toHaveBeenCalled();
    expect(mockQuizAnswerCreate).not.toHaveBeenCalled();
  });

  it("completion SQL aggregates best and lowest scores (GREATEST / LEAST)", async () => {
    mockFindUnique.mockResolvedValue(eligibleAnonymousLinkRow);
    await recordAnonymousQuizCompletion("tok", 50);

    const firstArg = mockExecuteRaw.mock.calls[0]?.[0] as
      | { strings: string[] }
      | string[]
      | undefined;

    const sqlText =
      firstArg &&
      typeof firstArg === "object" &&
      "strings" in firstArg &&
      Array.isArray(firstArg.strings)
        ? firstArg.strings.join("?")
        : Array.isArray(firstArg)
          ? firstArg.join("?")
          : "";

    expect(sqlText).toContain("GREATEST");
    expect(sqlText).toContain("LEAST");
    expect(sqlText).toContain("COALESCE");
  });

  it("refuses revoked links without executeRaw", async () => {
    mockFindUnique.mockResolvedValue({
      ...eligibleAnonymousLinkRow,
      revokedAt: new Date(),
    });

    const result = await recordAnonymousLinkOpen("tok");
    expect(result.success).toBe(false);
    expect(mockExecuteRaw).not.toHaveBeenCalled();
  });

  it("is idempotent at the call level: repeated opens each invoke executeRaw", async () => {
    mockFindUnique.mockResolvedValue(eligibleAnonymousLinkRow);

    await recordAnonymousLinkOpen("tok");
    await recordAnonymousLinkOpen("tok");

    expect(mockExecuteRaw).toHaveBeenCalledTimes(2);
  });
});
