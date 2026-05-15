import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockQuizFindFirst = vi.fn();
const mockQuizCreate = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quiz: {
      findFirst: (...args: unknown[]) => mockQuizFindFirst(...args),
      create: (...args: unknown[]) => mockQuizCreate(...args),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createDraftQuizAction } from "./actions";
import { DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS } from "@/lib/builder/defaultManualQuizSettings";

describe("createDraftQuizAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockQuizFindFirst.mockResolvedValue(null);
    mockQuizCreate.mockResolvedValue({ id: "quiz-new-1" });
  });

  it("creates a DRAFT private quiz with default settings when no empty draft exists", async () => {
    const result = await createDraftQuizAction("fr");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.quizId).toBe("quiz-new-1");

    expect(mockQuizFindFirst).toHaveBeenCalledWith({
      where: {
        ownerId: "user-1",
        status: "DRAFT",
        questions: { none: {} },
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });

    expect(mockQuizCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ownerId: "user-1",
        visibility: "PRIVATE",
        status: "DRAFT",
        settings: DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS,
        name: "",
      }),
    });
  });

  it("returns existing empty DRAFT id without creating a new quiz", async () => {
    mockQuizFindFirst.mockResolvedValue({ id: "draft-empty-1" });

    const result = await createDraftQuizAction("fr");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.quizId).toBe("draft-empty-1");
    expect(mockQuizCreate).not.toHaveBeenCalled();
  });

  it("does not reuse when findFirst returns null (e.g. only non-empty DRAFTs exist)", async () => {
    mockQuizFindFirst.mockResolvedValue(null);

    const result = await createDraftQuizAction("fr");

    expect(result.success).toBe(true);
    expect(mockQuizCreate).toHaveBeenCalledTimes(1);
  });

  it("rejects when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await createDraftQuizAction("fr");

    expect(result.success).toBe(false);
    expect(mockQuizFindFirst).not.toHaveBeenCalled();
    expect(mockQuizCreate).not.toHaveBeenCalled();
  });
});
