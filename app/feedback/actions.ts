"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  feedbackMetadataSchema,
  submitFeedbackSchema,
  submitQuizCreationReviewSchema,
  submitUserFeedbackSchema,
} from "@/lib/schemas/feedback.schema";
import type {
  SubmitFeedbackInput,
  SubmitQuizCreationReviewInput,
  SubmitUserFeedbackInput,
} from "@/lib/schemas/feedback.schema";
import { sendSupportNotificationIfNeeded } from "@/lib/sendSupportNotificationIfNeeded";
import type { Prisma } from "@/generated/prisma/client";

type ValidatedFeedbackInput = SubmitFeedbackInput;

const MAX_SUBMISSIONS_PER_HOUR = 5;
const MAX_ANONYMOUS_SUBMISSIONS_PER_HOUR = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

type SubmitFeedbackResponse =
  | { success: true }
  | { success: false; error: string };

async function checkRateLimit(userId: string | null): Promise<SubmitFeedbackResponse | null> {
  if (!prisma) {
    return {
      success: false,
      error: "errors.databaseNotInitialized",
    };
  }

  const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  if (userId) {
    const recentSubmissions = await prisma.feedback.count({
      where: {
        userId,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (recentSubmissions >= MAX_SUBMISSIONS_PER_HOUR) {
      return {
        success: false,
        error: "errors.rateLimitExceeded",
      };
    }
  } else {
    const recentAnonymous = await prisma.feedback.count({
      where: {
        userId: null,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (recentAnonymous >= MAX_ANONYMOUS_SUBMISSIONS_PER_HOUR) {
      return {
        success: false,
        error: "errors.rateLimitExceeded",
      };
    }
  }

  return null;
}

function buildFeedbackCreateData(
  userId: string | null,
  validatedInput: ValidatedFeedbackInput,
): Prisma.FeedbackUncheckedCreateInput {
  return {
    userId,
    quizId: validatedInput.quizId ?? null,
    type: validatedInput.type,
    rating: validatedInput.rating ?? null,
    message: validatedInput.message ?? null,
    featureRequest: validatedInput.featureRequest ?? null,
    category: validatedInput.category ?? null,
    metadata:
      validatedInput.metadata === undefined
        ? undefined
        : (validatedInput.metadata as Prisma.InputJsonValue),
    page: validatedInput.page,
    userAgent: validatedInput.userAgent,
    status: "NEW",
  };
}

async function createFeedbackCore(
  input: SubmitFeedbackInput,
): Promise<SubmitFeedbackResponse> {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    const rateLimitResult = await checkRateLimit(userId);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const validationResult = submitFeedbackSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError.message || "errors.invalidInput",
      };
    }

    const validatedInput = validationResult.data;

    const created = await prisma.feedback.create({
      data: buildFeedbackCreateData(userId, validatedInput),
      select: { id: true, type: true },
    });

    try {
      await sendSupportNotificationIfNeeded(created.id);
    } catch (error) {
      console.error("[createFeedbackAction] Support notification error:", error);
    }

    return { success: true };
  } catch (error) {
    console.error("[createFeedbackAction] Error:", error);
    return {
      success: false,
      error: "errors.feedbackSubmissionFailed",
    };
  }
}

export async function createFeedbackAction(
  input: SubmitFeedbackInput,
): Promise<SubmitFeedbackResponse> {
  return createFeedbackCore(input);
}

export async function submitFeedbackAction(
  input: SubmitFeedbackInput,
): Promise<SubmitFeedbackResponse> {
  return createFeedbackCore(input);
}

export async function submitUserFeedbackAction(
  input: SubmitUserFeedbackInput,
): Promise<SubmitFeedbackResponse> {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    const rateLimitResult = await checkRateLimit(userId);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const validationResult = submitUserFeedbackSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError.message || "errors.invalidInput",
      };
    }

    const validatedInput = validationResult.data;

    const appReviewInput: ValidatedFeedbackInput = {
      type: "APP_REVIEW",
      rating: validatedInput.rating,
      message: validatedInput.message,
      featureRequest: validatedInput.featureRequest,
      category: validatedInput.category,
      page: validatedInput.page,
      userAgent: validatedInput.userAgent,
    };

    const created = await prisma.feedback.create({
      data: buildFeedbackCreateData(userId, appReviewInput),
      select: { id: true },
    });

    void created;

    return { success: true };
  } catch (error) {
    console.error("[submitUserFeedbackAction] Error:", error);
    return {
      success: false,
      error: "errors.feedbackSubmissionFailed",
    };
  }
}

function buildQuizCreationReviewMetadata(
  questionCount?: number,
  quizStatus?: string,
): Record<string, string | number | boolean> {
  const metadata: Record<string, string | number | boolean> = {
    source: "quiz_success_page",
  };

  if (questionCount !== undefined) {
    metadata.questionCount = questionCount;
  }

  if (quizStatus !== undefined && quizStatus.length > 0) {
    metadata.quizStatus = quizStatus;
  }

  return metadata;
}

export async function submitQuizCreationReviewAction(
  input: SubmitQuizCreationReviewInput,
  context?: {
    questionCount?: number;
    quizStatus?: string;
  },
): Promise<SubmitFeedbackResponse> {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    if (!userId) {
      return { success: false, error: "errors.unauthorized" };
    }

    const rateLimitResult = await checkRateLimit(userId);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const validationResult = submitQuizCreationReviewSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError.message || "errors.invalidInput",
      };
    }

    const validatedInput = validationResult.data;

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: validatedInput.quizId,
        ownerId: userId,
      },
      select: {
        id: true,
        status: true,
        _count: { select: { questions: true } },
      },
    });

    if (!quiz) {
      return { success: false, error: "errors.invalidInput" };
    }

    const metadataPayload = buildQuizCreationReviewMetadata(
      context?.questionCount ?? quiz._count.questions,
      context?.quizStatus ?? quiz.status,
    );
    const metadataResult = feedbackMetadataSchema.safeParse(metadataPayload);
    if (!metadataResult.success) {
      return { success: false, error: "errors.invalidInput" };
    }

    const creationReviewInput: ValidatedFeedbackInput = {
      type: "QUIZ_CREATION_REVIEW",
      rating: validatedInput.rating,
      message: validatedInput.message,
      quizId: validatedInput.quizId,
      page: validatedInput.page,
      userAgent: validatedInput.userAgent,
      metadata: metadataResult.data,
    };

    await prisma.feedback.create({
      data: buildFeedbackCreateData(userId, creationReviewInput),
      select: { id: true },
    });

    return { success: true };
  } catch (error) {
    console.error("[submitQuizCreationReviewAction] Error:", error);
    return {
      success: false,
      error: "errors.feedbackSubmissionFailed",
    };
  }
}
