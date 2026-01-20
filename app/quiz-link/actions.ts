"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import crypto from "crypto";

type CreateQuizLinkResponse =
  | { success: true; quizLink: { id: string; token: string } }
  | { success: false; error: string };

type GetQuizLinkByTokenResponse =
  | {
      success: true;
      quizLink: {
        id: string;
        quizId: string;
        token: string;
        participantId: string | null;
        participant: {
          id: string;
          name: string;
          email: string | null;
        } | null;
        allowMultipleAttempts: boolean;
        expiresAt: Date | null;
        hasCompletedAttempt: boolean;
        quiz: {
          id: string;
          name: string;
          visibility: string;
          settings: any;
          questions: Array<{
            id: string;
            type: string;
            label: string;
            image: string | null;
            order: number;
            options: Array<{
              id: string;
              label: string;
              isCorrect: boolean;
            }>;
          }>;
        };
      };
    }
  | { success: false; error: string };

type CreateParticipantResponse =
  | { success: true; participant: { id: string; name: string } }
  | { success: false; error: string };

type StartQuizAttemptResponse =
  | {
      success: true;
      attempt: {
        id: string;
        quizLinkId: string;
        participantId: string | null;
      };
    }
  | { success: false; error: string };

/**
 * Generate a short, unique token for quiz links
 */
function generateToken(): string {
  return crypto.randomBytes(8).toString("base64url").substring(0, 12);
}

/**
 * Create or get a QuizLink for a quiz
 */
export async function createOrGetQuizLink(
  quizId: string,
  allowMultipleAttempts: boolean = true
): Promise<CreateQuizLinkResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();

    // Verify quiz exists and get details
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { ownerId: true, visibility: true },
    });

    if (!quiz) {
      return { success: false, error: "Quiz not found" };
    }

    // Require authentication
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (quiz.ownerId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (quiz.visibility !== "PUBLIC") {
      return { success: false, error: "Only public quizzes can be shared" };
    }

    // Check if a link already exists
    const existingLink = await prisma.quizLink.findFirst({
      where: { quizId },
    });

    if (existingLink) {
      // Update allowMultipleAttempts if different
      if (existingLink.allowMultipleAttempts !== allowMultipleAttempts) {
        const updated = await prisma.quizLink.update({
          where: { id: existingLink.id },
          data: { allowMultipleAttempts },
        });
        return {
          success: true,
          quizLink: { id: updated.id, token: updated.token },
        };
      }
      return {
        success: true,
        quizLink: { id: existingLink.id, token: existingLink.token },
      };
    }

    // Create new link
    let token = generateToken();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.quizLink.findUnique({
        where: { token },
      });
      if (!existing) break;
      token = generateToken();
      attempts++;
    }

    if (attempts >= 10) {
      return { success: false, error: "Failed to generate unique token" };
    }

    const quizLink = await prisma.quizLink.create({
      data: {
        quizId,
        token,
        allowMultipleAttempts,
      },
    });

    return {
      success: true,
      quizLink: { id: quizLink.id, token: quizLink.token },
    };
  } catch (error) {
    console.error("Error creating quiz link:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create quiz link",
    };
  }
}

/**
 * Get quiz link by token (public access)
 */
export async function getQuizLinkByToken(
  token: string
): Promise<GetQuizLinkByTokenResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const quizLink = await prisma.quizLink.findUnique({
      where: { token },
      include: {
        participant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        attempts: {
          where: {
            status: "COMPLETED",
          },
          select: {
            id: true,
            participantId: true,
          },
        },
        quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
              orderBy: {
                order: "asc",
              },
            },
          },
        },
      },
    });

    if (!quizLink) {
      return { success: false, error: "Quiz link not found" };
    }

    // Check if link is revoked
    if (quizLink.revokedAt) {
      return { success: false, error: "Quiz link has been revoked" };
    }

    // Check link expiration
    if (quizLink.expiresAt && quizLink.expiresAt < new Date()) {
      return { success: false, error: "Quiz link has expired" };
    }

    // Check if there's a completed attempt
    // For personalized links, check only for that participant
    // For public links, we can't check without participantId, so we'll check on client side
    let hasCompletedAttempt = false;
    if (!quizLink.allowMultipleAttempts) {
      if (quizLink.participantId) {
        // For personalized links, check if this participant has completed
        hasCompletedAttempt = quizLink.attempts.some(
          (a: any) => a.participantId === quizLink.participantId && a.status === "COMPLETED"
        );
      } else {
        // For public links (anonymous), check if any anonymous attempt is completed
        hasCompletedAttempt = quizLink.attempts.some(
          (a: any) => a.participantId === null && a.status === "COMPLETED"
        );
      }
    }

    return {
      success: true,
      quizLink: {
        id: quizLink.id,
        quizId: quizLink.quizId,
        token: quizLink.token,
        participantId: quizLink.participantId,
        participant: quizLink.participant
          ? {
              id: quizLink.participant.id,
              name: quizLink.participant.name,
              email: quizLink.participant.email,
            }
          : null,
        allowMultipleAttempts: quizLink.allowMultipleAttempts,
        expiresAt: quizLink.expiresAt,
        hasCompletedAttempt,
        quiz: {
          id: quizLink.quiz.id,
          name: quizLink.quiz.name,
          visibility: quizLink.quiz.visibility,
          settings: quizLink.quiz.settings as any,
          questions: quizLink.quiz.questions.map((q: any) => ({
            id: q.id,
            type: q.type,
            label: q.label,
            image: q.image,
            order: q.order,
            options: q.options.map((opt: any) => ({
              id: opt.id,
              label: opt.label,
              isCorrect: opt.isCorrect,
            })),
          })),
        },
      },
    };
  } catch (error) {
    console.error("Error getting quiz link:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get quiz link",
    };
  }
}

/**
 * Create a participant (public access)
 */
export async function createParticipant(
  name: string,
  email?: string
): Promise<CreateParticipantResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    if (!name || name.trim().length === 0) {
      return { success: false, error: "Name is required" };
    }

    if (name.length > 255) {
      return { success: false, error: "Name is too long" };
    }

    if (email && email.length > 255) {
      return { success: false, error: "Email is too long" };
    }

    const participant = await prisma.participant.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
      },
    });

    return {
      success: true,
      participant: { id: participant.id, name: participant.name },
    };
  } catch (error) {
    console.error("Error creating participant:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create participant",
    };
  }
}

/**
 * Start a quiz attempt (public access)
 * participantId is optional - null for anonymous participants (public links)
 */
export async function startQuizAttempt(
  quizLinkId: string,
  participantId: string | null
): Promise<StartQuizAttemptResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    // Verify quiz link exists
    // Fetch all attempts to check for anonymous and personalized attempts
    const quizLink = await prisma.quizLink.findUnique({
      where: { id: quizLinkId },
      include: {
        attempts: {
          where: {
            status: { in: ["IN_PROGRESS", "COMPLETED"] },
          },
        },
      },
    });

    if (!quizLink) {
      return { success: false, error: "Quiz link not found" };
    }

    // Check expiration
    if (quizLink.expiresAt && quizLink.expiresAt < new Date()) {
      return { success: false, error: "Quiz link has expired" };
    }

    // For personalized links, verify participant exists
    if (participantId) {
      const participant = await prisma.participant.findUnique({
        where: { id: participantId },
      });

      if (!participant) {
        return { success: false, error: "Participant not found" };
      }

      // Check if multiple attempts are allowed
      if (!quizLink.allowMultipleAttempts) {
        // Check for any completed attempt for this participant
        const existingCompleted = quizLink.attempts.find(
          (a: any) => a.participantId === participantId && a.status === "COMPLETED"
        );
        if (existingCompleted) {
          return {
            success: false,
            error: "alreadyCompleted",
          };
        }

        // Check for in-progress attempt - reuse it instead of creating a new one
        const existingInProgress = quizLink.attempts.find(
          (a: any) => a.participantId === participantId && a.status === "IN_PROGRESS"
        );
        if (existingInProgress) {
          return {
            success: true,
            attempt: {
              id: existingInProgress.id,
              quizLinkId: existingInProgress.quizLinkId,
              participantId: existingInProgress.participantId,
            },
          };
        }
      } else {
        // If multiple attempts are allowed, check if there's an in-progress attempt and reuse it
        const existingInProgress = quizLink.attempts.find(
          (a: any) => a.participantId === participantId && a.status === "IN_PROGRESS"
        );
        if (existingInProgress) {
          return {
            success: true,
            attempt: {
              id: existingInProgress.id,
              quizLinkId: existingInProgress.quizLinkId,
              participantId: existingInProgress.participantId,
            },
          };
        }
      }
    } else {
      // For anonymous participants (public links), check for in-progress attempt
      const existingInProgress = quizLink.attempts.find(
        (a: any) => a.participantId === null && a.status === "IN_PROGRESS"
      );
      if (existingInProgress) {
        return {
          success: true,
          attempt: {
            id: existingInProgress.id,
            quizLinkId: existingInProgress.quizLinkId,
            participantId: existingInProgress.participantId,
          },
        };
      }

      // For single-attempt anonymous quizzes, check if any anonymous attempt is completed
      if (!quizLink.allowMultipleAttempts) {
        const existingCompleted = quizLink.attempts.find(
          (a: any) => a.participantId === null && a.status === "COMPLETED"
        );
        if (existingCompleted) {
          return {
            success: false,
            error: "alreadyCompleted",
          };
        }
      }
    }

    // Create attempt (with or without participantId)
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizLink: {
          connect: { id: quizLinkId },
        },
        ...(participantId
          ? {
              participant: {
                connect: { id: participantId },
              },
            }
          : {}),
        status: "IN_PROGRESS",
      },
    });

    return {
      success: true,
      attempt: {
        id: attempt.id,
        quizLinkId: attempt.quizLinkId,
        participantId: attempt.participantId,
      },
    };
  } catch (error) {
    console.error("Error starting quiz attempt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to start quiz attempt",
    };
  }
}

/**
 * Get quiz link for a quiz (owner only)
 */
export async function getQuizLinkByQuizId(
  quizId: string
): Promise<
  | { success: true; quizLink: { id: string; token: string; allowMultipleAttempts: boolean } | null }
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

    // Verify quiz ownership
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { ownerId: true },
    });

    if (!quiz) {
      return { success: false, error: "Quiz not found" };
    }

    if (quiz.ownerId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    const quizLink = await prisma.quizLink.findFirst({
      where: { quizId },
      select: {
        id: true,
        token: true,
        allowMultipleAttempts: true,
      },
    });

    return {
      success: true,
      quizLink: quizLink || null,
    };
  } catch (error) {
    console.error("Error getting quiz link:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get quiz link",
    };
  }
}
