import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockAuth = vi.fn();
const mockQuizFindUnique = vi.fn();
const mockQuizCreate = vi.fn();
const mockQuizDelete = vi.fn();
const mockQuizUpdate = vi.fn();
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
      update: (...args: unknown[]) => mockQuizUpdate(...args),
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

import { SAVE_MODIFIED_QUIZ_AS_DRAFT_COPY_ERROR } from "@/lib/builder/saveModifiedQuizAsDraftCopy";

import { saveModifiedQuizAsDraftCopyAction } from "./actions";

const validSettings = {
  showAnswerImmediately: false,
  randomizeQuestions: false,
  randomizeOptions: false,
  timeLimitPerQuestion: null,
} as const;

function buildValidQuizBuilder(overrides?: Partial<{
  name: string;
  questions: Array<{
    id: string;
    type: "MULTIPLE_CHOICE";
    label: string;
    image?: string;
    imageKey?: string;
    options: Array<{ id: string; label: string; isCorrect: boolean }>;
  }>;
}>): import("@/types/quiz-builder").QuizBuilder {
  return {
    id: "client-quiz-id",
    name: overrides?.name ?? "My quiz",
    visibility: "PUBLIC",
    settings: { ...validSettings },
    createdBy: "USER",
    createdAt: new Date().toISOString(),
    questions: overrides?.questions ?? [
      {
        id: "q1",
        type: "MULTIPLE_CHOICE",
        label: "Q?",
        options: [
          { id: "o1", label: "A", isCorrect: true },
          { id: "o2", label: "B", isCorrect: false },
        ],
      },
    ],
  };
}

describe("saveModifiedQuizAsDraftCopyAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "owner-1" } });
    mockQuizDelete.mockResolvedValue(undefined);
    mockQuestionUpdate.mockResolvedValue(undefined);
    mockQuizUpdate.mockResolvedValue(undefined);
    mockDeleteQuestionImage.mockResolvedValue(undefined);
    mockQuizFindUnique.mockResolvedValue({
      ownerId: "owner-1",
      status: "ACTIVE",
    });
    mockCopyQuestionImageStorageObject.mockResolvedValue(
      "owner-1/quiz-new/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.png",
    );
    mockQuizCreate.mockResolvedValue({
      id: "quiz-new",
      questions: [{ id: "nq-0" }],
    });
  });

  it("returns Unauthorized when there is no session user", async () => {
    mockAuth.mockResolvedValue({ user: undefined });

    const result = await saveModifiedQuizAsDraftCopyAction(
      "quiz-original",
      buildValidQuizBuilder(),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(SAVE_MODIFIED_QUIZ_AS_DRAFT_COPY_ERROR.UNAUTHORIZED);
    }
    expect(mockQuizFindUnique).not.toHaveBeenCalled();
  });

  it("returns Unauthorized when the user does not own the quiz", async () => {
    mockQuizFindUnique.mockResolvedValue({
      ownerId: "other-user",
      status: "ACTIVE",
    });

    const result = await saveModifiedQuizAsDraftCopyAction(
      "quiz-original",
      buildValidQuizBuilder(),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(SAVE_MODIFIED_QUIZ_AS_DRAFT_COPY_ERROR.UNAUTHORIZED);
    }
    expect(mockQuizCreate).not.toHaveBeenCalled();
  });

  it("returns Quiz not found when the original quiz does not exist", async () => {
    mockQuizFindUnique.mockResolvedValue(null);

    const result = await saveModifiedQuizAsDraftCopyAction(
      "missing",
      buildValidQuizBuilder(),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(SAVE_MODIFIED_QUIZ_AS_DRAFT_COPY_ERROR.QUIZ_NOT_FOUND);
    }
    expect(mockQuizCreate).not.toHaveBeenCalled();
  });

  it("returns Validation failed when quizBuilder is invalid", async () => {
    const result = await saveModifiedQuizAsDraftCopyAction(
      "quiz-original",
      buildValidQuizBuilder({ name: "   " }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(SAVE_MODIFIED_QUIZ_AS_DRAFT_COPY_ERROR.VALIDATION_FAILED);
    }
    expect(mockQuizCreate).not.toHaveBeenCalled();
  });

  it("returns Validation failed when there are no questions", async () => {
    const result = await saveModifiedQuizAsDraftCopyAction("quiz-original", {
      ...buildValidQuizBuilder(),
      questions: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(SAVE_MODIFIED_QUIZ_AS_DRAFT_COPY_ERROR.VALIDATION_FAILED);
    }
    expect(mockQuizCreate).not.toHaveBeenCalled();
  });

  it("creates a new DRAFT PRIVATE quiz and does not update the original", async () => {
    const result = await saveModifiedQuizAsDraftCopyAction(
      "quiz-original",
      buildValidQuizBuilder({ name: "Edited title" }),
      "en",
    );

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.quizId).toBe("quiz-new");

    expect(mockQuizUpdate).not.toHaveBeenCalled();

    const createArg = mockQuizCreate.mock.calls[0][0];
    expect(createArg.data.status).toBe("DRAFT");
    expect(createArg.data.visibility).toBe("PRIVATE");
    expect(createArg.data.ownerId).toBe("owner-1");
    expect(createArg.data.name).toBe("Edited title (Copy)");
  });

  it("copies storage to a new imageKey when source question has imageKey", async () => {
    const quiz = buildValidQuizBuilder({
      questions: [
        {
          id: "q1",
          type: "MULTIPLE_CHOICE",
          label: "With image",
          imageKey: "owner-1/quiz-original/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png",
          options: [
            { id: "o1", label: "A", isCorrect: true },
            { id: "o2", label: "B", isCorrect: false },
          ],
        },
      ],
    });

    const result = await saveModifiedQuizAsDraftCopyAction("quiz-original", quiz);

    expect(result.success).toBe(true);
    expect(mockCopyQuestionImageStorageObject).toHaveBeenCalledWith({
      sourceKey: "owner-1/quiz-original/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png",
      targetUserId: "owner-1",
      targetQuizId: "quiz-new",
    });
    expect(mockQuestionUpdate).toHaveBeenCalledWith({
      where: { id: "nq-0" },
      data: {
        imageKey: "owner-1/quiz-new/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.png",
      },
    });

    const createArg = mockQuizCreate.mock.calls[0][0];
    const creates = createArg.data.questions.create;
    expect(creates[0].imageKey).toBeNull();
    expect(creates[0].image).toBeNull();
  });

  it("persists legacy image on the copy when there is no imageKey", async () => {
    mockQuizCreate.mockResolvedValue({
      id: "quiz-legacy",
      questions: [{ id: "nq-0" }],
    });

    const quiz = buildValidQuizBuilder({
      questions: [
        {
          id: "q1",
          type: "MULTIPLE_CHOICE",
          label: "Legacy",
          image: "data:image/png;base64,xxx",
          options: [
            { id: "o1", label: "A", isCorrect: true },
            { id: "o2", label: "B", isCorrect: false },
          ],
        },
      ],
    });

    const result = await saveModifiedQuizAsDraftCopyAction("quiz-original", quiz);

    expect(result.success).toBe(true);
    expect(mockCopyQuestionImageStorageObject).not.toHaveBeenCalled();
    expect(mockQuestionUpdate).not.toHaveBeenCalled();

    const createArg = mockQuizCreate.mock.calls[0][0];
    expect(createArg.data.questions.create[0].image).toBe("data:image/png;base64,xxx");
    expect(createArg.data.questions.create[0].imageKey).toBeNull();
  });

  it("returns Unauthorized when the original quiz is not ACTIVE", async () => {
    mockQuizFindUnique.mockResolvedValue({
      ownerId: "owner-1",
      status: "DRAFT",
    });

    const result = await saveModifiedQuizAsDraftCopyAction(
      "quiz-original",
      buildValidQuizBuilder(),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(SAVE_MODIFIED_QUIZ_AS_DRAFT_COPY_ERROR.UNAUTHORIZED);
    }
    expect(mockQuizCreate).not.toHaveBeenCalled();
  });

  it("returns Invalid question image reference when imageKey is unsafe", async () => {
    const quiz = buildValidQuizBuilder({
      questions: [
        {
          id: "q1",
          type: "MULTIPLE_CHOICE",
          label: "Bad",
          imageKey: "not-a-valid-key",
          options: [
            { id: "o1", label: "A", isCorrect: true },
            { id: "o2", label: "B", isCorrect: false },
          ],
        },
      ],
    });

    const result = await saveModifiedQuizAsDraftCopyAction("quiz-original", quiz);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(SAVE_MODIFIED_QUIZ_AS_DRAFT_COPY_ERROR.INVALID_IMAGE_KEY);
    }
    expect(mockQuizCreate).not.toHaveBeenCalled();
  });
});
