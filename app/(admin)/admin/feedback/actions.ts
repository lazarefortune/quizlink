"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { feedbackStatusSchema } from "@/lib/schemas/feedback.schema";
import { revalidatePath } from "next/cache";
import type { FeedbackStatus } from "@/lib/schemas/feedback.schema";

type GetFeedbacksResponse =
  | {
      success: true;
      feedbacks: Array<{
        id: string;
        userId: string | null;
        user: { email: string; name: string } | null;
        type: string;
        message: string;
        page: string;
        userAgent: string;
        status: string;
        createdAt: Date;
      }>;
    }
  | { success: false; error: string };

type UpdateFeedbackStatusResponse =
  | { success: true }
  | { success: false; error: string };

/**
 * Server Action: Get all feedbacks with filters
 *
 * SECURITY RULES:
 * - Only ADMIN users can access
 * - Filters by type and status
 */
export async function getFeedbacksAction(
  filters?: {
    type?: string;
    status?: string;
  }
): Promise<GetFeedbacksResponse> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  if (!prisma) {
    return { success: false, error: "Database not initialized" };
  }

  try {
    const where: {
      type?: string;
      status?: string;
    } = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const feedbacks = await prisma.feedback.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to first 100 feedbacks
    });

    return {
      success: true,
      feedbacks: feedbacks.map((f) => ({
        id: f.id,
        userId: f.userId,
        user: f.user
          ? {
              email: f.user.email,
              name: f.user.name,
            }
          : null,
        type: f.type,
        message: f.message,
        page: f.page,
        userAgent: f.userAgent,
        status: f.status,
        createdAt: f.createdAt,
      })),
    };
  } catch (error) {
    console.error("[getFeedbacksAction] Error:", error);
    return { success: false, error: "Failed to fetch feedbacks" };
  }
}

/**
 * Server Action: Update feedback status
 *
 * SECURITY RULES:
 * - Only ADMIN users can update
 * - Status must be valid enum value
 */
export async function updateFeedbackStatusAction(
  feedbackId: string,
  status: FeedbackStatus
): Promise<UpdateFeedbackStatusResponse> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  if (!prisma) {
    return { success: false, error: "Database not initialized" };
  }

  try {
    // Validate status
    const statusValidation = feedbackStatusSchema.safeParse(status);
    if (!statusValidation.success) {
      return { success: false, error: "Invalid status" };
    }

    // Check if feedback exists
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      return { success: false, error: "Feedback not found" };
    }

    // Update status
    await prisma.feedback.update({
      where: { id: feedbackId },
      data: { status: statusValidation.data },
    });

    revalidatePath("/admin/feedback");
    return { success: true };
  } catch (error) {
    console.error("[updateFeedbackStatusAction] Error:", error);
    return { success: false, error: "Failed to update feedback status" };
  }
}
