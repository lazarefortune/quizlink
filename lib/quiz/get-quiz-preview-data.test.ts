import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.fn();
const mockQuizFindUnique = vi.fn();
const mockQuizLinkCreate = vi.fn();
const mockQuizAttemptCreate = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quiz: {
      findUnique: (...args: unknown[]) => mockQuizFindUnique(...args),
    },
    quizLink: {
      create: (...args: unknown[]) => mockQuizLinkCreate(...args),
    },
    quizAttempt: {
      create: (...args: unknown[]) => mockQuizAttemptCreate(...args),
    },
  },
}));

import { getQuizPreviewData } from "./get-quiz-preview-data";

const sampleQuiz = {
  id: "quiz-1",
  name: "Sample",
  status: "DRAFT",
  ownerId: "user-1",
  settings: {
    showAnswerImmediately: false,
    showAnswersAtEnd: false,
    randomizeQuestions: true,
    randomizeOptions: true,
    timeLimitPerQuestion: 30,
  },
  questions: [
    {
      id: "q1",
      order: 0,
      type: "MULTIPLE_CHOICE",
      label: "Q1",
      image: null,
      imageKey: null,
      explanation: null,
      options: [{ id: "o1", label: "Yes", isCorrect: true }],
    },
  ],
};

describe("getQuizPreviewData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("allows preview for DRAFT quiz owned by the user", async () => {
    mockQuizFindUnique.mockResolvedValue(sampleQuiz);

    const result = await getQuizPreviewData("quiz-1");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.quizStatus).toBe("DRAFT");
    expect(result.data.settings.showAnswerImmediately).toBe(false);
    expect(result.data.settings.randomizeQuestions).toBe(true);
    expect(mockQuizLinkCreate).not.toHaveBeenCalled();
    expect(mockQuizAttemptCreate).not.toHaveBeenCalled();
  });

  it("allows preview for ACTIVE quiz owned by the user", async () => {
    mockQuizFindUnique.mockResolvedValue({ ...sampleQuiz, status: "ACTIVE" });

    const result = await getQuizPreviewData("quiz-1");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.quizStatus).toBe("ACTIVE");
  });

  it("rejects non-owner access", async () => {
    mockQuizFindUnique.mockResolvedValue({ ...sampleQuiz, ownerId: "other" });

    const result = await getQuizPreviewData("quiz-1");

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error).toContain("unauthorized");
  });

  it("rejects unauthenticated access", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await getQuizPreviewData("quiz-1");

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error).toBe("Unauthorized");
  });
});
