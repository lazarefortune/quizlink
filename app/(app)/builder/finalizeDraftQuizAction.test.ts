import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdateMany = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quiz: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { finalizeDraftQuizAction } from "./actions";
import { FINALIZE_DRAFT_QUIZ_ERROR_CODE } from "@/lib/builder/finalizeDraftQuizErrors";

const validDraftRow = {
  id: "quiz-1",
  name: "My draft",
  ownerId: "user-1",
  status: "DRAFT",
  visibility: "PRIVATE",
  settings: {
    showAnswerImmediately: true,
    randomizeQuestions: false,
    randomizeOptions: false,
    timeLimitPerQuestion: null,
  },
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  questions: [
    {
      id: "qq1",
      type: "MULTIPLE_CHOICE",
      label: "Question?",
      image: null,
      imageKey: null,
      explanation: null,
      options: [
        { id: "o1", label: "Yes", isCorrect: true },
        { id: "o2", label: "No", isCorrect: false },
      ],
    },
  ],
};

describe("finalizeDraftQuizAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("returns NOT_AUTHENTICATED when there is no session user", async () => {
    mockAuth.mockResolvedValue({ user: undefined });

    const result = await finalizeDraftQuizAction("quiz-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(FINALIZE_DRAFT_QUIZ_ERROR_CODE.NOT_AUTHENTICATED);
    }
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("returns QUIZ_NOT_FOUND when quiz does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await finalizeDraftQuizAction("missing");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(FINALIZE_DRAFT_QUIZ_ERROR_CODE.QUIZ_NOT_FOUND);
    }
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("returns NOT_OWNER when quiz belongs to another user", async () => {
    mockFindUnique.mockResolvedValue({
      ...validDraftRow,
      ownerId: "other-user",
    });

    const result = await finalizeDraftQuizAction("quiz-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(FINALIZE_DRAFT_QUIZ_ERROR_CODE.NOT_OWNER);
    }
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("returns NOT_DRAFT when quiz is already ACTIVE", async () => {
    mockFindUnique.mockResolvedValue({
      ...validDraftRow,
      status: "ACTIVE",
    });

    const result = await finalizeDraftQuizAction("quiz-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(FINALIZE_DRAFT_QUIZ_ERROR_CODE.NOT_DRAFT);
    }
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("returns ARCHIVED when quiz is archived", async () => {
    mockFindUnique.mockResolvedValue({
      ...validDraftRow,
      status: "ARCHIVED",
    });

    const result = await finalizeDraftQuizAction("quiz-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(FINALIZE_DRAFT_QUIZ_ERROR_CODE.ARCHIVED);
    }
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("returns NO_QUESTIONS when draft has zero questions", async () => {
    mockFindUnique.mockResolvedValue({
      ...validDraftRow,
      questions: [],
    });

    const result = await finalizeDraftQuizAction("quiz-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(FINALIZE_DRAFT_QUIZ_ERROR_CODE.NO_QUESTIONS);
    }
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED when a question label is empty", async () => {
    mockFindUnique.mockResolvedValue({
      ...validDraftRow,
      questions: [
        {
          ...validDraftRow.questions[0],
          label: "   ",
        },
      ],
    });

    const result = await finalizeDraftQuizAction("quiz-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(FINALIZE_DRAFT_QUIZ_ERROR_CODE.VALIDATION_FAILED);
    }
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("activates a valid DRAFT and sets publishedAt", async () => {
    mockFindUnique.mockResolvedValue(validDraftRow);

    const result = await finalizeDraftQuizAction("quiz-1");

    expect(result.success).toBe(true);
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "quiz-1",
        ownerId: "user-1",
        status: "DRAFT",
      },
      data: expect.objectContaining({
        status: "ACTIVE",
        publishedAt: expect.any(Date) as Date,
      }),
    });
  });

  it("returns NOT_DRAFT when update affects zero rows", async () => {
    mockFindUnique.mockResolvedValue(validDraftRow);
    mockUpdateMany.mockResolvedValue({ count: 0 });

    const result = await finalizeDraftQuizAction("quiz-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(FINALIZE_DRAFT_QUIZ_ERROR_CODE.NOT_DRAFT);
    }
  });
});
