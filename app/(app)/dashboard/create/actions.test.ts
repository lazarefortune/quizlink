import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockQuizFindFirst = vi.fn();
const mockQuizCreate = vi.fn();
const mockQuizUpdate = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quiz: {
      findFirst: (...args: unknown[]) => mockQuizFindFirst(...args),
      create: (...args: unknown[]) => mockQuizCreate(...args),
      update: (...args: unknown[]) => mockQuizUpdate(...args),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createDraftQuizAction } from "./actions";
import { DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS } from "@/lib/builder/defaultManualQuizSettings";
import { t } from "@/lib/i18n";

describe("createDraftQuizAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockQuizFindFirst.mockResolvedValue(null);
    mockQuizCreate.mockResolvedValue({ id: "quiz-new-1" });
    mockQuizUpdate.mockResolvedValue({ id: "draft-empty-1" });
  });

  it("creates a DRAFT private quiz with the provided name when no empty draft exists", async () => {
    const result = await createDraftQuizAction("fr", "Mon blind test");

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
        name: "Mon blind test",
      }),
    });
    expect(mockQuizUpdate).not.toHaveBeenCalled();
  });

  it("reuses empty DRAFT and updates its name", async () => {
    mockQuizFindFirst.mockResolvedValue({ id: "draft-empty-1" });

    const result = await createDraftQuizAction("fr", "Nouveau titre");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.quizId).toBe("draft-empty-1");
    expect(mockQuizCreate).not.toHaveBeenCalled();
    expect(mockQuizUpdate).toHaveBeenCalledWith({
      where: { id: "draft-empty-1" },
      data: { name: "Nouveau titre" },
    });
  });

  it("rejects empty name", async () => {
    const result = await createDraftQuizAction("fr", "   ");

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error).toBe(t("fr", "builder.quizNameRequired"));
    expect(mockQuizFindFirst).not.toHaveBeenCalled();
    expect(mockQuizCreate).not.toHaveBeenCalled();
    expect(mockQuizUpdate).not.toHaveBeenCalled();
  });

  it("does not reuse when findFirst returns null (e.g. only non-empty DRAFTs exist)", async () => {
    mockQuizFindFirst.mockResolvedValue(null);

    const result = await createDraftQuizAction("en", "Weekend trivia");

    expect(result.success).toBe(true);
    expect(mockQuizCreate).toHaveBeenCalledTimes(1);
    expect(mockQuizUpdate).not.toHaveBeenCalled();
  });

  it("rejects when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await createDraftQuizAction("fr", "Titre");

    expect(result.success).toBe(false);
    expect(mockQuizFindFirst).not.toHaveBeenCalled();
    expect(mockQuizCreate).not.toHaveBeenCalled();
    expect(mockQuizUpdate).not.toHaveBeenCalled();
  });
});
