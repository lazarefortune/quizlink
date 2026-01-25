"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submitFeedbackSchema } from "@/lib/schemas/feedback.schema";
import type { SubmitFeedbackInput } from "@/lib/schemas/feedback.schema";

const MAX_SUBMISSIONS_PER_HOUR = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

type SubmitFeedbackResponse =
  | { success: true }
  | { success: false; error: string };

/**
 * Server Action: Submit feedback
 *
 * SECURITY RULES:
 * - Only authenticated users can submit feedback
 * - Rate limiting: max 5 submissions per hour
 * - Input validation with Zod
 * - userId attached server-side only
 * - No HTML injection (message stored as plain text)
 */
export async function submitFeedbackAction(
  input: SubmitFeedbackInput
): Promise<SubmitFeedbackResponse> {
  try {
    // Step 1: Authenticate user (server-side only)
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "errors.unauthorized",
      };
    }

    const userId = session.user.id;

    if (!prisma) {
      return {
        success: false,
        error: "errors.databaseNotInitialized",
      };
    }

    // Step 2: Validate input with Zod
    const validationResult = submitFeedbackSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return {
        success: false,
        error: firstError.message || "errors.invalidInput",
      };
    }

    const validatedInput = validationResult.data;

    // Step 3: Rate limiting - check submissions in last hour
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
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

    // Step 4: Create feedback
    await prisma.feedback.create({
      data: {
        userId,
        type: validatedInput.type,
        message: validatedInput.message.trim(),
        page: validatedInput.page,
        userAgent: validatedInput.userAgent,
        status: "NEW",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[submitFeedbackAction] Error:", error);
    return {
      success: false,
      error: "errors.feedbackSubmissionFailed",
    };
  }
}
