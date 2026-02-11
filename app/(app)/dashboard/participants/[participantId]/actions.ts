"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendEmail as sendEmailUtil } from "@/lib/email";
import { toggleParticipantPortal as togglePortal } from "@/lib/participant-portal";

type GetParticipantDetailsResponse =
  | {
      success: true;
      participant: {
        id: string;
        name: string;
        email: string | null;
        avatar: string | null;
        createdAt: Date;
        publicToken: string | null;
        isPortalEnabled: boolean;
        links: Array<{
          id: string;
          token: string;
          quizId: string;
          quizName: string;
          quizVisibility: string;
          allowMultipleAttempts: boolean;
          createdAt: Date;
          expiresAt: Date | null;
          revokedAt: Date | null;
          attempts: Array<{
            id: string;
            startedAt: Date;
            finishedAt: Date | null;
            score: number | null;
            status: string;
          }>;
        }>;
      };
    }
  | { success: false; error: string };

type RevokeLinkResponse =
  | { success: true }
  | { success: false; error: string };

type SendLinkEmailResponse =
  | { success: true }
  | { success: false; error: string };

/**
 * Get detailed information about a participant
 */
export async function getParticipantDetails(
  participantId: string
): Promise<GetParticipantDetailsResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get participant with all links and attempts
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        links: {
          include: {
            quiz: {
              select: {
                id: true,
                name: true,
                visibility: true,
                ownerId: true,
              },
            },
            attempts: {
              where: {
                participantId,
              },
              orderBy: {
                startedAt: "desc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!participant) {
      return { success: false, error: "Participant not found" };
    }

    // Verify participant is associated with user's quizzes
    const isAssociated =
      participant.createdByUserId === session.user.id ||
      participant.links.some((link) => link.quiz.ownerId === session.user.id);

    if (!isAssociated) {
      return { success: false, error: "Unauthorized" };
    }

    // Filter links to only show those for user's quizzes
    const userLinks = participant.links.filter(
      (link) => link.quiz.ownerId === session.user.id
    );

    return {
      success: true,
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        avatar: participant.avatar,
        createdAt: participant.createdAt,
        publicToken: participant.publicToken,
        isPortalEnabled: participant.isPortalEnabled,
        links: userLinks.map((link) => ({
          id: link.id,
          token: link.token,
          quizId: link.quiz.id,
          quizName: link.quiz.name,
          quizVisibility: link.quiz.visibility,
          allowMultipleAttempts: link.allowMultipleAttempts,
          createdAt: link.createdAt,
          expiresAt: link.expiresAt,
          revokedAt: link.revokedAt,
          attempts: link.attempts.map((attempt) => ({
            id: attempt.id,
            startedAt: attempt.startedAt,
            finishedAt: attempt.finishedAt,
            score: attempt.score,
            status: attempt.status,
          })),
        })),
      },
    };
  } catch (error) {
    console.error("Error getting participant details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get participant details",
    };
  }
}

export type TogglePortalResponse =
  | { success: true; publicToken: string | null }
  | { success: false; error: string };

/**
 * Enable or disable the participant's public portal.
 */
export async function toggleParticipantPortal(
  participantId: string,
  enabled: boolean
): Promise<TogglePortalResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }
  const result = await togglePortal(session.user.id, participantId, enabled);
  if (result.success) {
    revalidatePath(`/dashboard/participants/${participantId}`);
  }
  return result;
}

/**
 * Revoke a quiz link (delete it, but keep attempts)
 */
export async function revokeLink(linkId: string): Promise<RevokeLinkResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify link belongs to user's quiz
    const link = await prisma.quizLink.findUnique({
      where: { id: linkId },
      include: {
        quiz: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!link) {
      return { success: false, error: "Link not found" };
    }

    if (link.quiz.ownerId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Mark the link as revoked (soft delete) but keep it and attempts
    await prisma.quizLink.update({
      where: { id: linkId },
      data: {
        revokedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/participants");
    if (link.participantId) {
      revalidatePath(`/dashboard/participants/${link.participantId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error revoking link:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to revoke link",
    };
  }
}

/**
 * Restore a revoked link
 */
export async function restoreLink(linkId: string): Promise<RevokeLinkResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const link = await prisma.quizLink.findUnique({
      where: { id: linkId },
      include: {
        quiz: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!link) {
      return { success: false, error: "Link not found" };
    }

    if (link.quiz.ownerId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Restore the link by setting revokedAt to null
    await prisma.quizLink.update({
      where: { id: linkId },
      data: {
        revokedAt: null,
      },
    });

    revalidatePath("/dashboard/participants");
    if (link.participantId) {
      revalidatePath(`/dashboard/participants/${link.participantId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error restoring link:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to restore link",
    };
  }
}

/**
 * Delete a quiz link permanently
 */
export async function deleteLink(linkId: string): Promise<RevokeLinkResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const link = await prisma.quizLink.findUnique({
      where: { id: linkId },
      include: {
        quiz: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!link) {
      return { success: false, error: "Link not found" };
    }

    if (link.quiz.ownerId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Delete the link (cascade will delete attempts and answers)
    await prisma.quizLink.delete({
      where: { id: linkId },
    });

    revalidatePath("/dashboard/participants");
    if (link.participantId) {
      revalidatePath(`/dashboard/participants/${link.participantId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting link:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete link",
    };
  }
}

/**
 * Delete all attempts for a quiz link
 */
export async function deleteAllAttempts(linkId: string): Promise<RevokeLinkResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify link belongs to user's quiz
    const link = await prisma.quizLink.findUnique({
      where: { id: linkId },
      include: {
        quiz: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!link) {
      return { success: false, error: "Link not found" };
    }

    if (link.quiz.ownerId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Delete all attempts for this link (cascade will delete answers)
    await prisma.quizAttempt.deleteMany({
      where: { quizLinkId: linkId },
    });

    revalidatePath("/dashboard/participants");
    if (link.participantId) {
      revalidatePath(`/dashboard/participants/${link.participantId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting attempts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete attempts",
    };
  }
}

/**
 * Send a quiz link by email to a participant
 */
export async function sendLinkEmail(
  linkId: string,
  recipientEmail: string
): Promise<SendLinkEmailResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify link belongs to user's quiz
    const link = await prisma.quizLink.findUnique({
      where: { id: linkId },
      include: {
        quiz: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
        participant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!link) {
      return { success: false, error: "Link not found" };
    }

    if (link.quiz.ownerId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (!link.participant) {
      return { success: false, error: "Link is not personalized" };
    }

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const quizUrl = `${baseUrl}/quiz/${link.token}`;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return { success: false, error: "Invalid email address" };
    }

    // Send email
    const result = await sendEmailUtil({
      to: recipientEmail,
      subject: `Invitation au quiz : ${link.quiz.name}`,
      html: `
        <h2>Bonjour ${link.participant?.name || "participant"},</h2>
        <p>Tu as été invité à participer au quiz : <strong>${link.quiz.name}</strong>.</p>
        <p>Clique sur le lien ci-dessous pour accéder directement au quiz :</p>
        <p><a href="${quizUrl}">${quizUrl}</a></p>
        <p>Ce lien est personnalisé pour toi et te permet d'accéder directement au quiz sans remplir de formulaire.</p>
        <p>Bonne chance !</p>
      `,
    });

    if (!result.success) {
      return { success: false, error: result.error || "Failed to send email" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending link email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

/**
 * Get attempt details with answers
 */
export async function getParticipantAttemptDetails(
  attemptId: string
): Promise<
  | {
      success: true;
      attempt: {
        id: string;
        quizName: string;
        participantName: string;
        startedAt: Date;
        finishedAt: Date | null;
        score: number | null;
        status: string;
        answers: Array<{
          questionId: string;
          questionLabel: string;
          questionType: string;
          selectedOptionIds: string[];
          selectedOptions: Array<{ id: string; label: string }>;
          correctOptionIds: string[];
          correctOptions: Array<{ id: string; label: string }>;
          isCorrect: boolean;
          timeSpent: number | null;
          answeredAt: Date;
        }>;
        questionOrder: Array<{ id: string; order: number }>;
      };
    }
  | { success: false; error: string }
> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        participant: true,
        quizLink: {
          include: {
            quiz: {
              select: {
                id: true,
                name: true,
                ownerId: true,
                questions: {
                  select: {
                    id: true,
                    order: true,
                  },
                  orderBy: {
                    order: "asc",
                  },
                },
              },
            },
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return { success: false, error: "Attempt not found" };
    }

    // Verify quiz ownership
    if (attempt.quizLink.quiz.ownerId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Create a map of answers by questionId for quick lookup
    const answersMap = new Map(
      attempt.answers.map((answer) => {
        const selectedOptionIds = Array.isArray(answer.selectedOptionIds)
          ? (answer.selectedOptionIds as string[])
          : [];
        const correctOptions = answer.question.options.filter((opt) => opt.isCorrect);
        const correctOptionIds = correctOptions.map((opt) => opt.id);
        const selectedOptions = answer.question.options.filter((opt) =>
          selectedOptionIds.includes(opt.id)
        );

        return [
          answer.question.id,
          {
            questionId: answer.question.id,
            questionLabel: answer.question.label,
            questionType: answer.question.type,
            selectedOptionIds: selectedOptionIds as string[],
            selectedOptions: selectedOptions.map((opt) => ({
              id: opt.id,
              label: opt.label,
            })),
            correctOptionIds,
            correctOptions: correctOptions.map((opt) => ({
              id: opt.id,
              label: opt.label,
            })),
            isCorrect: answer.isCorrect,
            timeSpent: answer.timeSpent,
            answeredAt: answer.answeredAt,
          },
        ];
      })
    );

    // Order answers by quiz question order
    const answers = attempt.quizLink.quiz.questions
      .map((question) => answersMap.get(question.id))
      .filter((answer) => answer !== undefined) as Array<{
      questionId: string;
      questionLabel: string;
      questionType: string;
      selectedOptionIds: string[];
      selectedOptions: Array<{ id: string; label: string }>;
      correctOptionIds: string[];
      correctOptions: Array<{ id: string; label: string }>;
      isCorrect: boolean;
      timeSpent: number | null;
      answeredAt: Date;
    }>;

    return {
      success: true,
      attempt: {
        id: attempt.id,
        quizName: attempt.quizLink.quiz.name,
        participantName: attempt.participant?.name || "Anonyme",
        startedAt: attempt.startedAt,
        finishedAt: attempt.finishedAt,
        score: attempt.score,
        status: attempt.status,
        answers,
        questionOrder: attempt.quizLink.quiz.questions,
      },
    };
  } catch (error) {
    console.error("Error getting attempt details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get attempt details",
    };
  }
}
