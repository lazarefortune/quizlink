import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockAuth = vi.fn();
const mockQuizFindUnique = vi.fn();
const mockQuizCreate = vi.fn();
const mockQuizDelete = vi.fn();
const mockQuestionUpdate = vi.fn();
const mockCopyQuestionImageStorageObject = vi.fn();
const mockDeleteQuestionImage = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quiz: {
      findUnique: (...args: unknown[]) => mockQuizFindUnique(...args),
      create: (...args: unknown[]) => mockQuizCreate(...args),
      delete: (...args: unknown[]) => mockQuizDelete(...args),
    },
    question: {
      update: (...args: unknown[]) => mockQuestionUpdate(...args),
    },
  },
}));

vi.mock("@/lib/storage/question-image-storage", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/storage/question-image-storage")>();
  return {
    ...actual,
    copyQuestionImageStorageObject: (
      ...args: Parameters<typeof actual.copyQuestionImageStorageObject>
    ) => mockCopyQuestionImageStorageObject(...args),
    deleteQuestionImage: (...args: Parameters<typeof actual.deleteQuestionImage>) =>
      mockDeleteQuestionImage(...args),
  };
});

import { duplicateQuiz } from "./actions";

describe("duplicateQuiz", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "owner-1" } });
    mockQuizDelete.mockResolvedValue(undefined);
    mockQuestionUpdate.mockResolvedValue(undefined);
    mockDeleteQuestionImage.mockResolvedValue(undefined);
    mockQuizFindUnique.mockResolvedValue({
      ownerId: "owner-1",
      name: "Source",
      visibility: "PRIVATE",
      status: "ACTIVE",
      publishedAt: new Date("2024-06-01T12:00:00.000Z"),
      settings: {},
      questions: [
        {
          type: "MULTIPLE_CHOICE",
          label: "Q1",
          image: null,
          imageKey:
            "owner-1/quiz-src/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png",
          explanation: null,
          order: 0,
          options: [{ label: "A", isCorrect: true }],
        },
        {
          type: "MULTIPLE_CHOICE",
          label: "Q2",
          image: "data:image/png;base64,xxx",
          imageKey: null,
          explanation: null,
          order: 1,
          options: [{ label: "B", isCorrect: false }],
        },
      ],
    });
  });

  it("creates questions with null imageKey then copies storage for keyed questions", async () => {
    mockCopyQuestionImageStorageObject.mockResolvedValue(
      "owner-1/quiz-new/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.png",
    );
    mockQuizCreate.mockResolvedValue({
      id: "quiz-new",
      questions: [
        { id: "nq-0", order: 0 },
        { id: "nq-1", order: 1 },
      ],
    });

    const result = await duplicateQuiz("quiz-src");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.quizId).toBe("quiz-new");

    const createArg = mockQuizCreate.mock.calls[0][0];
    expect(createArg.data.status).toBe("ACTIVE");
    expect(createArg.data.publishedAt).toEqual(new Date("2024-06-01T12:00:00.000Z"));
    const creates = createArg.data.questions.create;
    expect(creates[0].imageKey).toBeNull();
    expect(creates[1].imageKey).toBeNull();
    expect(creates[1].image).toBe("data:image/png;base64,xxx");

    expect(mockCopyQuestionImageStorageObject).toHaveBeenCalledTimes(1);
    expect(mockCopyQuestionImageStorageObject).toHaveBeenCalledWith({
      sourceKey: "owner-1/quiz-src/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png",
      targetUserId: "owner-1",
      targetQuizId: "quiz-new",
    });

    expect(mockQuestionUpdate).toHaveBeenCalledWith({
      where: { id: "nq-0" },
      data: {
        imageKey: "owner-1/quiz-new/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.png",
      },
    });
    expect(mockQuestionUpdate).toHaveBeenCalledTimes(1);
    expect(mockQuizDelete).not.toHaveBeenCalled();
    expect(mockDeleteQuestionImage).not.toHaveBeenCalled();
  });

  it("preserves DRAFT and null publishedAt when duplicating a draft quiz", async () => {
    mockQuizFindUnique.mockResolvedValue({
      ownerId: "owner-1",
      name: "Draft source",
      visibility: "PRIVATE",
      status: "DRAFT",
      publishedAt: null,
      settings: {},
      questions: [
        {
          type: "MULTIPLE_CHOICE",
          label: "Q1",
          image: null,
          imageKey: null,
          explanation: null,
          order: 0,
          options: [
            { label: "A", isCorrect: true },
            { label: "B", isCorrect: false },
          ],
        },
      ],
    });
    mockQuizCreate.mockResolvedValue({
      id: "quiz-draft-copy",
      questions: [{ id: "nq-0", order: 0 }],
    });

    const result = await duplicateQuiz("quiz-draft");

    expect(result.success).toBe(true);
    const createArg = mockQuizCreate.mock.calls[0][0];
    expect(createArg.data.status).toBe("DRAFT");
    expect(createArg.data.publishedAt).toBeNull();
  });

  it("does not call copy when no question has imageKey", async () => {
    mockQuizFindUnique.mockResolvedValue({
      ownerId: "owner-1",
      name: "No images",
      visibility: "PRIVATE",
      status: "ACTIVE",
      publishedAt: null,
      settings: {},
      questions: [
        {
          type: "MULTIPLE_CHOICE",
          label: "Q1",
          image: "legacy-only",
          imageKey: null,
          explanation: null,
          order: 0,
          options: [],
        },
      ],
    });
    mockQuizCreate.mockResolvedValue({
      id: "quiz-new-2",
      questions: [{ id: "nq-a", order: 0 }],
    });

    const result = await duplicateQuiz("quiz-a");

    expect(result.success).toBe(true);
    expect(mockCopyQuestionImageStorageObject).not.toHaveBeenCalled();
    expect(mockQuestionUpdate).not.toHaveBeenCalled();
  });

  it("rolls back quiz and copied files when copy fails", async () => {
    mockQuizFindUnique.mockResolvedValue({
      ownerId: "owner-1",
      name: "Source",
      visibility: "PRIVATE",
      status: "ACTIVE",
      publishedAt: new Date("2024-01-01T00:00:00.000Z"),
      settings: {},
      questions: [
        {
          type: "MULTIPLE_CHOICE",
          label: "Q1",
          image: null,
          imageKey:
            "owner-1/quiz-src/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png",
          explanation: null,
          order: 0,
          options: [{ label: "A", isCorrect: true }],
        },
        {
          type: "MULTIPLE_CHOICE",
          label: "Q2",
          image: null,
          imageKey:
            "owner-1/quiz-src/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.png",
          explanation: null,
          order: 1,
          options: [{ label: "B", isCorrect: false }],
        },
      ],
    });
    mockCopyQuestionImageStorageObject
      .mockResolvedValueOnce(
        "owner-1/quiz-new/ffffffffffffffffffffffffffffffff.png",
      )
      .mockRejectedValueOnce(new Error("disk full"));
    mockQuizCreate.mockResolvedValue({
      id: "quiz-new",
      questions: [
        { id: "nq-0", order: 0 },
        { id: "nq-1", order: 1 },
      ],
    });

    const result = await duplicateQuiz("quiz-src");

    expect(result.success).toBe(false);
    expect(mockQuestionUpdate).toHaveBeenCalledTimes(1);
    expect(mockQuizDelete).toHaveBeenCalledWith({ where: { id: "quiz-new" } });
    expect(mockDeleteQuestionImage).toHaveBeenCalledWith(
      "owner-1/quiz-new/ffffffffffffffffffffffffffffffff.png",
    );
  });

  it("returns error when source imageKey is not a safe storage key", async () => {
    mockQuizFindUnique.mockResolvedValue({
      ownerId: "owner-1",
      name: "Bad key",
      visibility: "PRIVATE",
      status: "ACTIVE",
      publishedAt: null,
      settings: {},
      questions: [
        {
          type: "MULTIPLE_CHOICE",
          label: "Q1",
          image: null,
          imageKey: "invalid",
          explanation: null,
          order: 0,
          options: [],
        },
      ],
    });

    const result = await duplicateQuiz("quiz-bad");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid question image reference on source quiz");
    }
    expect(mockQuizCreate).not.toHaveBeenCalled();
  });
});
