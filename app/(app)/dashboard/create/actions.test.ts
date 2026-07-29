import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockQuizCreate = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quiz: {
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
    mockQuizCreate.mockResolvedValue({ id: "quiz-new-1" });
  });

  it("creates a DRAFT private quiz with an empty name", async () => {
    const result = await createDraftQuizAction("fr", "");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.quizId).toBe("quiz-new-1");

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

  it("creates a DRAFT private quiz with the provided name", async () => {
    const result = await createDraftQuizAction("fr", "Mon blind test");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.quizId).toBe("quiz-new-1");

    expect(mockQuizCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ownerId: "user-1",
        visibility: "PRIVATE",
        status: "DRAFT",
        settings: DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS,
        name: "Mon blind test",
      }),
    });
  });

  it("always creates a new draft even when other empty drafts exist", async () => {
    mockQuizCreate
      .mockResolvedValueOnce({ id: "quiz-new-1" })
      .mockResolvedValueOnce({ id: "quiz-new-2" });

    const first = await createDraftQuizAction("fr", "Premier brouillon");
    const second = await createDraftQuizAction("fr", "Deuxième brouillon");

    expect(first).toEqual({ success: true, quizId: "quiz-new-1" });
    expect(second).toEqual({ success: true, quizId: "quiz-new-2" });
    expect(mockQuizCreate).toHaveBeenCalledTimes(2);
  });

  it("rejects whitespace-only name as empty trimmed name", async () => {
    const result = await createDraftQuizAction("fr", "   ");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(mockQuizCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: "" }),
    });
  });

  it("rejects when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await createDraftQuizAction("fr", "Titre");

    expect(result.success).toBe(false);
    expect(mockQuizCreate).not.toHaveBeenCalled();
  });
});
