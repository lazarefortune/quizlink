"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submitFeedbackSchema } from "@/lib/schemas/feedback.schema";
import type { SubmitFeedbackInput } from "@/lib/schemas/feedback.schema";
import { sendSupportNotificationIfNeeded } from "@/lib/sendSupportNotificationIfNeeded";

const MAX_SUBMISSIONS_PER_HOUR = 5;
const MAX_ANONYMOUS_SUBMISSIONS_PER_HOUR = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

type SubmitFeedbackResponse =
  | { success: true }
  | { success: false; error: string };

async function createFeedbackCore(
  input: SubmitFeedbackInput,
): Promise<SubmitFeedbackResponse> {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    if (!prisma) {
      return {
        success: false,
        error: "errors.databaseNotInitialized",
      };
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

    const created = await prisma.feedback.create({
      data: {
        userId,
        type: validatedInput.type,
        message: validatedInput.message,
        page: validatedInput.page,
        userAgent: validatedInput.userAgent,
        status: "NEW",
      },
      select: { id: true },
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
