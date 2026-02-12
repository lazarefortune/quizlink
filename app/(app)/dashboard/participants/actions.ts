"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

type GetParticipantsResponse =
  | {
      success: true;
      participants: Array<{
        id: string;
        name: string;
        email: string | null;
        avatar: string | null;
        gender: "MALE" | "FEMALE" | "OTHER" | null;
        createdAt: Date;
        attemptsCount: number;
        quizzes: Array<{
          quizId: string;
          quizName: string;
          linkToken: string;
        }>;
      }>;
    }
  | { success: false; error: string };

type CreateParticipantResponse =
  | { success: true; participant: { id: string; name: string; email: string | null } }
  | { success: false; error: string };

type UpdateParticipantResponse =
  | { success: true; participant: { id: string; name: string; email: string | null } }
  | { success: false; error: string };

type DeleteParticipantResponse =
  | { success: true }
  | { success: false; error: string };

type CreateParticipantLinkResponse =
  | { success: true; link: { token: string; url: string } }
  | { success: false; error: string };

/**
 * Generate a short, unique token for quiz links
 */
function generateToken(): string {
  return crypto.randomBytes(8).toString("base64url").substring(0, 12);
}

/**
 * Get all participants for the current user's quizzes
 */
export async function getParticipants(): Promise<GetParticipantsResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get all quiz IDs owned by the user
    const userQuizzes = await prisma.quiz.findMany({
      where: { ownerId: session.user.id },
      select: { id: true },
    });

    const quizIds = userQuizzes.map((q) => q.id);

    // Get all participants created by the user
    // Also include participants that have links to user's quizzes (in case createdByUserId is null)
    const participantsCreatedByUser = await prisma.participant.findMany({
      where: {
        OR: [
          { createdByUserId: session.user.id },
          ...(quizIds.length > 0 ? [{
            links: {
              some: {
                quizId: { in: quizIds },
              },
            },
          }] : []),
        ],
      },
      include: {
        links: {
          where: quizIds.length > 0 ? {
            quizId: { in: quizIds },
          } : undefined,
          include: {
            quiz: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        attempts: {
          where: quizIds.length > 0 ? {
            quizLink: {
              quizId: { in: quizIds },
            },
          } : undefined,
        },
      },
    });

    // Get all quiz links for these quizzes (including those with participantId)
    const quizLinks = quizIds.length > 0 ? await prisma.quizLink.findMany({
      where: {
        quizId: { in: quizIds },
        participantId: { not: null },
      },
      include: {
        participant: true,
        quiz: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }) : [];

    // Get all participants that have attempts on user's quizzes
    // Only get attempts with participants (exclude anonymous attempts)
    const attempts = quizIds.length > 0 ? await prisma.quizAttempt.findMany({
      where: {
        quizLink: {
          quizId: { in: quizIds },
        },
        participantId: { not: null }, // Exclude anonymous attempts
      },
      include: {
        participant: true,
      },
    }) : [];

    // Combine participants from all sources
    const participantMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string | null;
        avatar: string | null;
        gender: "MALE" | "FEMALE" | "OTHER" | null;
        createdAt: Date;
        attemptsCount: number;
        quizzes: Array<{ quizId: string; quizName: string; linkToken: string }>;
      }
    >();

    // Add all participants created by the user
    for (const participant of participantsCreatedByUser) {
      participantMap.set(participant.id, {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        avatar: participant.avatar,
        gender: participant.gender as "MALE" | "FEMALE" | "OTHER" | null,
        createdAt: participant.createdAt,
        attemptsCount: participant.attempts.length, // Already filtered by quizIds
        quizzes: participant.links.map((link) => ({
          quizId: link.quiz.id,
          quizName: link.quiz.name,
          linkToken: link.token,
        })),
      });
    }

    // Add participants from links (in case they weren't already added)
    for (const link of quizLinks) {
      if (link.participant) {
        const participantId = link.participant.id;
        if (!participantMap.has(participantId)) {
          participantMap.set(participantId, {
            id: participantId,
            name: link.participant.name,
            email: link.participant.email,
            avatar: link.participant.avatar,
            gender: link.participant.gender as "MALE" | "FEMALE" | "OTHER" | null,
            createdAt: link.participant.createdAt,
            attemptsCount: 0,
            quizzes: [],
          });
        }
        const participant = participantMap.get(participantId)!;
        // Add quiz if not already present
        if (!participant.quizzes.some((q) => q.quizId === link.quiz.id)) {
          participant.quizzes.push({
            quizId: link.quiz.id,
            quizName: link.quiz.name,
            linkToken: link.token,
          });
        }
      }
    }

    // Count all attempts for each participant (avoid double counting)
    // Only count attempts with participants (exclude anonymous attempts)
    const attemptsByParticipant = new Map<string, number>();
    for (const attempt of attempts) {
      // Skip anonymous attempts (participant is null)
      if (!attempt.participant) {
        continue;
      }
      const participantId = attempt.participant.id;
      attemptsByParticipant.set(
        participantId,
        (attemptsByParticipant.get(participantId) || 0) + 1
      );
    }

    // Update attempts count for all participants
    for (const [participantId, count] of attemptsByParticipant.entries()) {
      if (participantMap.has(participantId)) {
        participantMap.get(participantId)!.attemptsCount = count;
      } else {
        // Add participant if not already in map
        const attempt = attempts.find((a) => a.participant && a.participant.id === participantId);
        if (attempt && attempt.participant) {
          participantMap.set(participantId, {
            id: participantId,
            name: attempt.participant.name,
            email: attempt.participant.email,
            avatar: attempt.participant.avatar,
            gender: attempt.participant.gender as "MALE" | "FEMALE" | "OTHER" | null,
            createdAt: attempt.participant.createdAt,
            attemptsCount: count,
            quizzes: [],
          });
        }
      }
    }

    return {
      success: true,
      participants: Array.from(participantMap.values()),
    };
  } catch (error) {
    console.error("Error getting participants:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get participants",
    };
  }
}

/**
 * Create a new participant
 */
export async function createParticipant(
  name: string,
  email?: string,
  gender?: "MALE" | "FEMALE" | "OTHER"
): Promise<CreateParticipantResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (!name.trim()) {
      return { success: false, error: "Name is required" };
    }

    const participant = await prisma.participant.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        gender: gender || null,
        createdByUserId: session.user.id,
      },
    });

    // Generate avatar after creation (using participant ID as seed and gender)
    const { generateParticipantAvatar } = await import("@/lib/participant-avatar");
    const avatarSvg = generateParticipantAvatar(participant.id, gender || null);

    // Update participant with avatar
    await prisma.participant.update({
      where: { id: participant.id },
      data: { avatar: avatarSvg },
    });

    revalidatePath("/dashboard/participants");

    return {
      success: true,
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
      },
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
 * Update a participant
 */
export async function updateParticipant(
  participantId: string,
  name: string,
  email?: string,
  gender?: "MALE" | "FEMALE" | "OTHER"
): Promise<UpdateParticipantResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (!name.trim()) {
      return { success: false, error: "Name is required" };
    }

    // Verify participant exists and is associated with user's quizzes or created by user
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      select: {
        id: true,
        createdByUserId: true,
        links: {
          include: {
            quiz: {
              select: { ownerId: true },
            },
          },
        },
        attempts: {
          include: {
            quizLink: {
              include: {
                quiz: {
                  select: { ownerId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!participant) {
      return { success: false, error: "Participant not found" };
    }

    // Check if participant was created by user, or is associated with user's quizzes
    const isCreatedByUser = participant.createdByUserId === session.user.id;
    const isAssociated = participant.links.some(
      (link) => link.quiz.ownerId === session.user.id
    ) || participant.attempts.some(
      (attempt) => attempt.quizLink.quiz.ownerId === session.user.id
    );

    if (!isCreatedByUser && !isAssociated) {
      return { success: false, error: "Unauthorized" };
    }

    // Get current participant to check if gender changed
    const currentParticipant = await prisma.participant.findUnique({
      where: { id: participantId },
      select: { gender: true },
    });

    const updated = await prisma.participant.update({
      where: { id: participantId },
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        gender: gender || null,
      },
    });

    // Regenerate avatar if gender changed
    if (currentParticipant?.gender !== (gender || null)) {
      const { generateParticipantAvatar } = await import("@/lib/participant-avatar");
      const avatarSvg = generateParticipantAvatar(participantId, gender || null);
      await prisma.participant.update({
        where: { id: participantId },
        data: { avatar: avatarSvg },
      });
    }

    revalidatePath("/dashboard/participants");

    return {
      success: true,
      participant: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
      },
    };
  } catch (error) {
    console.error("Error updating participant:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update participant",
    };
  }
}

/**
 * Delete a participant
 */
export async function deleteParticipant(
  participantId: string
): Promise<DeleteParticipantResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify participant exists and is associated with user's quizzes or created by user
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      select: {
        id: true,
        createdByUserId: true,
        links: {
          include: {
            quiz: {
              select: { ownerId: true },
            },
          },
        },
        attempts: {
          include: {
            quizLink: {
              include: {
                quiz: {
                  select: { ownerId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!participant) {
      return { success: false, error: "Participant not found" };
    }

    // Check if participant was created by user, or is associated with user's quizzes
    const isCreatedByUser = participant.createdByUserId === session.user.id;
    const isAssociated = participant.links.some(
      (link) => link.quiz.ownerId === session.user.id
    ) || participant.attempts.some(
      (attempt) => attempt.quizLink.quiz.ownerId === session.user.id
    );

    if (!isCreatedByUser && !isAssociated) {
      return { success: false, error: "Unauthorized" };
    }

    // Delete participant (cascade will delete attempts and links)
    await prisma.participant.delete({
      where: { id: participantId },
    });

    revalidatePath("/dashboard/participants");

    return { success: true };
  } catch (error) {
    console.error("Error deleting participant:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete participant",
    };
  }
}

/**
 * Create a personalized link for a participant to access a quiz
 */
export async function createParticipantLink(
  participantId: string,
  quizId: string,
  allowMultipleAttempts: boolean = true,
  expiresAt?: Date | null
): Promise<CreateParticipantLinkResponse> {
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
      select: { ownerId: true, visibility: true },
    });

    if (!quiz) {
      return { success: false, error: "Quiz not found" };
    }

    if (quiz.ownerId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (quiz.visibility !== "PUBLIC") {
      return { success: false, error: "Only public quizzes can be shared" };
    }

    // Verify participant exists
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
    });

    if (!participant) {
      return { success: false, error: "Participant not found" };
    }

    // Check if a personalized link already exists
    const existingLink = await prisma.quizLink.findFirst({
      where: {
        quizId,
        participantId,
      },
    });

    if (existingLink) {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return {
        success: true,
        link: {
          token: existingLink.token,
          url: `${baseUrl}/quiz/${existingLink.token}`,
        },
      };
    }

    // Generate unique token
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

    // Create personalized link
    const quizLink = await prisma.quizLink.create({
      data: {
        quizId,
        participantId,
        token,
        allowMultipleAttempts,
        expiresAt: expiresAt || null,
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    revalidatePath("/dashboard/participants");

    return {
      success: true,
      link: {
        token: quizLink.token,
        url: `${baseUrl}/quiz/${quizLink.token}`,
      },
    };
  } catch (error) {
    console.error("Error creating participant link:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create participant link",
    };
  }
}
