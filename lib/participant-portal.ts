"use server";

import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const PUBLIC_TOKEN_LENGTH = 16;

function generatePublicToken(): string {
  return crypto.randomBytes(PUBLIC_TOKEN_LENGTH).toString("base64url").slice(0, 22);
}

export type ParticipantPortalQuiz = {
  quizId: string;
  quizName: string;
  linkToken: string;
  attemptsCount: number;
  bestScore: number | null;
  lastAttemptAt: Date | null;
  expiresAt: Date | null;
};

export type GetParticipantPortalResult =
  | {
      success: true;
      participant: { name: string };
      quizzes: ParticipantPortalQuiz[];
    }
  | { success: false; error: string };

/**
 * Get participant portal data by public token.
 * Returns participant name and list of quizzes they have access to with progress.
 */
export async function getParticipantPortal(
  participantToken: string
): Promise<GetParticipantPortalResult> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const participant = await prisma.participant.findFirst({
      where: { publicToken: participantToken },
      select: {
        id: true,
        name: true,
        isPortalEnabled: true,
        links: {
          where: { revokedAt: null },
          select: {
            token: true,
            quizId: true,
            expiresAt: true,
            quiz: { select: { id: true, name: true } },
            attempts: {
              where: { status: "COMPLETED" },
              select: {
                score: true,
                finishedAt: true,
              },
            },
          },
        },
      },
    });

    if (!participant) {
      return { success: false, error: "Lien invalide" };
    }

    if (!participant.isPortalEnabled) {
      return { success: false, error: "Ce portail n'est pas activé" };
    }

    const quizzes: ParticipantPortalQuiz[] = participant.links.map((link) => {
      const attempts = link.attempts;
      const scores = attempts.filter((a) => a.score != null).map((a) => a.score as number);
      const bestScore = scores.length > 0 ? Math.max(...scores) : null;
      const withDate = attempts.filter((a) => a.finishedAt != null) as Array<{ finishedAt: Date }>;
      const lastAttemptAt =
        withDate.length > 0
          ? withDate.reduce(
              (latest, a) => (a.finishedAt > latest ? a.finishedAt : latest),
              withDate[0].finishedAt
            )
          : null;

      return {
        quizId: link.quiz.id,
        quizName: link.quiz.name,
        linkToken: link.token,
        attemptsCount: attempts.length,
        bestScore,
        lastAttemptAt,
        expiresAt: link.expiresAt,
      };
    });

    return {
      success: true,
      participant: { name: participant.name },
      quizzes,
    };
  } catch (e) {
    console.error("getParticipantPortal:", e);
    return { success: false, error: "Une erreur s'est produite" };
  }
}

export type ToggleParticipantPortalResult =
  | { success: true; publicToken: string | null }
  | { success: false; error: string };

/**
 * Enable or disable the participant's public portal.
 * Generates publicToken if enabling and none exists.
 * Only the participant owner (createdByUserId) can toggle.
 */
export async function toggleParticipantPortal(
  ownerUserId: string,
  participantId: string,
  enabled: boolean
): Promise<ToggleParticipantPortalResult> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const participant = await prisma.participant.findFirst({
      where: { id: participantId, createdByUserId: ownerUserId },
      select: { id: true, publicToken: true },
    });

    if (!participant) {
      return { success: false, error: "Participant non trouvé" };
    }

    let publicToken: string | null = participant.publicToken;

    if (enabled && !publicToken) {
      let unique = false;
      for (let i = 0; i < 5; i++) {
        publicToken = generatePublicToken();
        const existing = await prisma.participant.findFirst({
          where: { publicToken: publicToken },
        });
        if (!existing) {
          unique = true;
          break;
        }
      }
      if (!unique) {
        return { success: false, error: "Impossible de générer un lien unique" };
      }
    }

    await prisma.participant.update({
      where: { id: participantId },
      data: {
        isPortalEnabled: enabled,
        ...(enabled && publicToken ? { publicToken } : {}),
      },
    });

    return {
      success: true,
      publicToken: enabled ? publicToken : null,
    };
  } catch (e) {
    console.error("toggleParticipantPortal:", e);
    return { success: false, error: "Une erreur s'est produite" };
  }
}
