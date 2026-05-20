import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockCreate = vi.fn();
const mockCount = vi.fn();
const mockSendSupportNotificationIfNeeded = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/sendSupportNotificationIfNeeded", () => ({
  sendSupportNotificationIfNeeded: (...args: unknown[]) =>
    mockSendSupportNotificationIfNeeded(...args),
}));

const mockQuizFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    feedback: {
      create: (...args: unknown[]) => mockCreate(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
    quiz: {
      findFirst: (...args: unknown[]) => mockQuizFindFirst(...args),
    },
  },
}));

import {
  createFeedbackAction,
  submitQuizCreationReviewAction,
  submitUserFeedbackAction,
} from "./actions";

describe("createFeedbackAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue({ id: "feedback-new" });
    mockSendSupportNotificationIfNeeded.mockResolvedValue(undefined);
  });

  it("creates support feedback with userId when session exists", async () => {
    const result = await createFeedbackAction({
      type: "BUG",
      message: "Something is broken here",
      page: "/dashboard",
      userAgent: "Mozilla/5.0",
    });

    expect(result).toEqual({ success: true });
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        quizId: null,
        type: "BUG",
        rating: null,
        message: "Something is broken here",
        featureRequest: null,
        category: null,
        metadata: undefined,
        page: "/dashboard",
        userAgent: "Mozilla/5.0",
        status: "NEW",
      },
      select: { id: true, type: true },
    });
    expect(mockSendSupportNotificationIfNeeded).toHaveBeenCalledWith("feedback-new");
  });

  it("creates legacy FEEDBACK with null userId when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await createFeedbackAction({
      type: "FEEDBACK",
      message: "Anonymous note",
      page: "/foo",
      userAgent: "",
    });

    expect(result).toEqual({ success: true });
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: null,
        type: "FEEDBACK",
        message: "Anonymous note",
      }),
      select: { id: true, type: true },
    });
  });

  it("returns success when support notification fails after create", async () => {
    mockSendSupportNotificationIfNeeded.mockRejectedValue(new Error("notify failed"));

    const result = await createFeedbackAction({
      type: "BUG",
      message: "Something is broken here",
      page: "/dashboard",
      userAgent: "Mozilla/5.0",
    });

    expect(result).toEqual({ success: true });
  });

  it("returns validation error without creating when page is invalid", async () => {
    const result = await createFeedbackAction({
      type: "BUG",
      message: "hellohello",
      page: "no-leading-slash",
      userAgent: "ua",
    });

    expect(result).toEqual({ success: false, error: "Chemin de page invalide" });
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("submitUserFeedbackAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue({ id: "review-new" });
    mockSendSupportNotificationIfNeeded.mockResolvedValue(undefined);
  });

  it("creates APP_REVIEW with rating", async () => {
    const result = await submitUserFeedbackAction({
      rating: 5,
      page: "/dashboard",
      userAgent: "Mozilla/5.0",
    });

    expect(result).toEqual({ success: true });
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        quizId: null,
        type: "APP_REVIEW",
        rating: 5,
        message: null,
        featureRequest: null,
        category: null,
        metadata: undefined,
        page: "/dashboard",
        userAgent: "Mozilla/5.0",
        status: "NEW",
      },
      select: { id: true },
    });
    expect(mockSendSupportNotificationIfNeeded).not.toHaveBeenCalled();
  });

  it("creates APP_REVIEW with featureRequest", async () => {
    const result = await submitUserFeedbackAction({
      rating: 4,
      featureRequest: "Better AI generation",
      page: "/builder/quiz-1",
      userAgent: "Mozilla/5.0",
    });

    expect(result).toEqual({ success: true });
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "APP_REVIEW",
        rating: 4,
        featureRequest: "Better AI generation",
      }),
      select: { id: true },
    });
  });

  it("rejects submission without rating", async () => {
    const result = await submitUserFeedbackAction({
      page: "/dashboard",
      userAgent: "Mozilla/5.0",
    } as { rating: number; page: string; userAgent: string });

    expect(result.success).toBe(false);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("submitQuizCreationReviewAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue({ id: "creation-review-1" });
    mockQuizFindFirst.mockResolvedValue({
      id: "quiz_abc",
      status: "ACTIVE",
      _count: { questions: 8 },
    });
  });

  it("creates QUIZ_CREATION_REVIEW with rating and quizId", async () => {
    const result = await submitQuizCreationReviewAction({
      rating: 5,
      quizId: "quiz_abc",
      page: "/dashboard/quiz/quiz_abc/success",
      userAgent: "Mozilla/5.0",
    });

    expect(result).toEqual({ success: true });
    expect(mockQuizFindFirst).toHaveBeenCalledWith({
      where: { id: "quiz_abc", ownerId: "user-1" },
      select: {
        id: true,
        status: true,
        _count: { select: { questions: true } },
      },
    });
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        quizId: "quiz_abc",
        type: "QUIZ_CREATION_REVIEW",
        rating: 5,
        message: null,
        featureRequest: null,
        category: null,
        metadata: {
          source: "quiz_success_page",
          questionCount: 8,
          quizStatus: "ACTIVE",
        },
        page: "/dashboard/quiz/quiz_abc/success",
        userAgent: "Mozilla/5.0",
        status: "NEW",
      },
      select: { id: true },
    });
  });

  it("accepts optional message", async () => {
    const result = await submitQuizCreationReviewAction({
      rating: 3,
      message: "Options un peu confuses",
      quizId: "quiz_abc",
      page: "/dashboard/quiz/quiz_abc/success",
      userAgent: "Mozilla/5.0",
    });

    expect(result).toEqual({ success: true });
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        message: "Options un peu confuses",
      }),
      select: { id: true },
    });
  });

  it("rejects submission without rating", async () => {
    const result = await submitQuizCreationReviewAction({
      quizId: "quiz_abc",
      page: "/dashboard/quiz/quiz_abc/success",
      userAgent: "Mozilla/5.0",
    } as {
      rating: number;
      quizId: string;
      page: string;
      userAgent: string;
    });

    expect(result.success).toBe(false);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects when quiz is not owned by user", async () => {
    mockQuizFindFirst.mockResolvedValue(null);

    const result = await submitQuizCreationReviewAction({
      rating: 4,
      quizId: "quiz_other",
      page: "/dashboard/quiz/quiz_other/success",
      userAgent: "Mozilla/5.0",
    });

    expect(result).toEqual({ success: false, error: "errors.invalidInput" });
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
