"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type QuizSettings = {
  showAnswerImmediately?: boolean;
  randomizeQuestions?: boolean;
  timeLimitPerQuestion?: number | null;
};

type GetQuizStatsResponse =
  | {
      success: true;
      stats: {
        totalInvitations: number;
        enrolledParticipantsCount: number;
        totalParticipants: number;
        totalAttempts: number;
        anonymousAttemptsCount: number;
        completedAttempts: number;
        averageScore: number;
        completionRate: number;
        totalQuestions: number;
        quizDetails: {
          visibility: string;
          settings: QuizSettings;
          createdAt: Date;
        };
        participants: Array<{
          id: string;
          name: string;
          email: string | null;
          avatar: string | null;
          attemptsCount: number;
          lastScore: number | null;
          lastAttemptDate: Date | null;
        }>;
        attempts: Array<{
          id: string;
          participantName: string;
          isAnonymous: boolean;
          score: number | null;
          duration: number | null;
          status: string;
          startedAt: Date;
          finishedAt: Date | null;
          questionsAnswered: number;
        }>;
      };
    }
  | { success: false; error: string };

type GetAttemptDetailsResponse =
  | {
      success: true;
      attempt: {
        id: string;
        participantName: string;
        score: number | null;
        status: string;
        startedAt: Date;
        finishedAt: Date | null;
        answers: Array<{
          questionId: string;
          questionLabel: string;
          selectedOptionIds: string[];
          selectedOptions: Array<{ id: string; label: string }>;
          correctOptionIds: string[];
          correctOptions: Array<{ id: string; label: string }>;
          isCorrect: boolean;
          timeSpent: number | null;
        }>;
        questionOrder?: Array<{ id: string; order: number }>;
      };
    }
  | { success: false; error: string };

export type QuizContentQuestion = {
  id: string;
  order: number;
  type: string;
  label: string;
  image: string | null;
  explanation: string | null;
  options: Array<{ id: string; label: string; isCorrect: boolean }>;
};

export type GetQuizContentResponse =
  | {
      success: true;
      quiz: {
        name: string;
        visibility: string;
        questions: QuizContentQuestion[];
      };
    }
  | { success: false; error: string };

/**
 * Get quiz content (questions, options, explanations) for display / edit link
 */
export async function getQuizContent(
  quizId: string
): Promise<GetQuizContentResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        name: true,
        visibility: true,
        ownerId: true,
        questions: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            order: true,
            type: true,
            label: true,
            image: true,
            explanation: true,
            options: {
              select: { id: true, label: true, isCorrect: true },
            },
          },
        },
      },
    });

    if (!quiz || quiz.ownerId !== session.user.id) {
      return { success: false, error: "Quiz not found or unauthorized" };
    }

    return {
      success: true,
      quiz: {
        name: quiz.name,
        visibility: quiz.visibility,
        questions: quiz.questions.map((q) => ({
          id: q.id,
          order: q.order,
          type: q.type,
          label: q.label,
          image: q.image,
          explanation: q.explanation,
          options: q.options.map((o) => ({
            id: o.id,
            label: o.label,
            isCorrect: o.isCorrect,
          })),
        })),
      },
    };
  } catch (error) {
    console.error("Error getting quiz content:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get quiz",
    };
  }
}

/**
 * Get statistics for a quiz
 */
export async function getQuizStats(
  quizId: string
): Promise<GetQuizStatsResponse> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify quiz ownership and get quiz details
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        ownerId: true,
        visibility: true,
        settings: true,
        createdAt: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    if (!quiz) {
      return { success: false, error: "Quiz not found" };
    }

    if (quiz.ownerId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get quiz links
    const quizLinks = await prisma.quizLink.findMany({
      where: { quizId },
      include: {
        attempts: {
          include: {
            participant: true,
            answers: true,
          },
        },
      },
    });

    type RawAttempt = {
      id: string;
      participantId: string | null;
      participant: {
        id: string;
        name: string;
        email: string | null;
        avatar: string | null;
      } | null;
      score: number | null;
      status: string;
      startedAt: Date;
      finishedAt: Date | null;
      answers: unknown[];
    };

    const allAttempts = quizLinks.flatMap((link) => link.attempts as RawAttempt[]);
    const completedAttempts = allAttempts.filter(
      (a) => a.status === "COMPLETED"
    );

    // Calculate stats
    const totalInvitations = quizLinks.length;
    const enrolledParticipantsCount = quizLinks.filter(
      (link: { participantId: string | null }) => link.participantId != null
    ).length;
    const attemptsWithParticipants = allAttempts.filter(
      (a) => a.participantId !== null
    );
    const uniqueParticipants = new Set(
      attemptsWithParticipants.map((a) => a.participantId)
    );
    const totalParticipants = uniqueParticipants.size;
    const totalAttempts = allAttempts.length;
    const anonymousAttemptsCount = allAttempts.filter(
      (a) => a.participantId === null
    ).length;

    const averageScore =
      completedAttempts.length > 0
        ? completedAttempts.reduce((sum: number, a) => sum + (a.score ?? 0), 0) /
          completedAttempts.length
        : 0;

    const completionRate =
      totalAttempts > 0
        ? (completedAttempts.length / totalAttempts) * 100
        : 0;

    // Get participants with stats (only for attempts with participants)
    const participantsMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string | null;
        avatar: string | null;
        attempts: typeof allAttempts;
      }
    >();

    attemptsWithParticipants.forEach((attempt) => {
      const participant = attempt.participant;
      if (participant && !participantsMap.has(participant.id)) {
        participantsMap.set(participant.id, {
          id: participant.id,
          name: participant.name,
          email: participant.email,
          avatar: participant.avatar,
          attempts: [],
        });
      }
      if (participant) {
        participantsMap.get(participant.id)!.attempts.push(attempt);
      }
    });

    const participants = Array.from(participantsMap.values()).map((p) => {
      const completed = p.attempts.filter((a) => a.status === "COMPLETED");
      const lastAttempt = completed
        .sort(
          (a, b) =>
            (b.finishedAt?.getTime() ?? 0) - (a.finishedAt?.getTime() ?? 0)
        )[0];

      return {
        id: p.id,
        name: p.name,
        email: p.email,
        avatar: p.avatar,
        attemptsCount: p.attempts.length,
        lastScore: lastAttempt?.score ?? null,
        lastAttemptDate: lastAttempt?.finishedAt ?? null,
      };
    });

    // Get attempts list
    const attempts = allAttempts
      .map((attempt) => {
        const duration =
          attempt.finishedAt && attempt.startedAt
            ? Math.floor(
                (attempt.finishedAt.getTime() - attempt.startedAt.getTime()) /
                  1000
              )
            : null;

        return {
          id: attempt.id,
          participantName: attempt.participant ? attempt.participant.name : "Anonyme",
          isAnonymous: !attempt.participant,
          score: attempt.score,
          duration,
          status: attempt.status,
          startedAt: attempt.startedAt,
          finishedAt: attempt.finishedAt,
          questionsAnswered: attempt.answers ? attempt.answers.length : 0,
        };
      })
      .sort(
        (a: { startedAt: Date }, b: { startedAt: Date }) =>
          b.startedAt.getTime() - a.startedAt.getTime()
      );

    const settings = (quiz.settings ?? {}) as QuizSettings;

    return {
      success: true,
      stats: {
        totalInvitations,
        enrolledParticipantsCount,
        totalParticipants,
        totalAttempts,
        anonymousAttemptsCount,
        completedAttempts: completedAttempts.length,
        averageScore,
        completionRate,
        totalQuestions: quiz._count.questions,
        quizDetails: {
          visibility: quiz.visibility,
          settings,
          createdAt: quiz.createdAt,
        },
        participants,
        attempts,
      },
    };
  } catch (error) {
    console.error("Error getting quiz stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get quiz stats",
    };
  }
}

/**
 * Get details for a specific attempt
 */
export async function getAttemptDetails(
  attemptId: string
): Promise<GetAttemptDetailsResponse> {
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
        quizLink: {
          include: {
            quiz: {
              select: {
                ownerId: true,
                questions: { select: { id: true, order: true }, orderBy: { order: "asc" } },
              },
            },
          },
        },
        participant: true,
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

    // Verify ownership
    if (attempt.quizLink.quiz.ownerId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    const answers = attempt.answers.map((answer) => {
      const correctOptionIds = answer.question.options
        .filter((opt) => opt.isCorrect)
        .map((opt) => opt.id);

      const rawSelected = Array.isArray(answer.selectedOptionIds)
        ? answer.selectedOptionIds
        : [];
      const selectedOptionIds = rawSelected.filter(
        (id): id is string => typeof id === "string"
      );

      // Get selected options with labels
      const selectedOptions = answer.question.options.filter((opt) =>
        selectedOptionIds.includes(opt.id)
      ).map((opt) => ({
        id: opt.id,
        label: opt.label,
      }));

      // Get correct options with labels
      const correctOptions = answer.question.options
        .filter((opt) => opt.isCorrect)
        .map((opt) => ({
          id: opt.id,
          label: opt.label,
        }));

      return {
        questionId: answer.question.id,
        questionLabel: answer.question.label,
        selectedOptionIds,
        selectedOptions,
        correctOptionIds,
        correctOptions,
        isCorrect: answer.isCorrect,
        timeSpent: answer.timeSpent,
      };
    });

    const quiz = attempt.quizLink.quiz as { ownerId: string; questions: Array<{ id: string; order: number }> };
    const questionOrder = quiz.questions?.map((q) => ({ id: q.id, order: q.order })) ?? [];

    return {
      success: true,
      attempt: {
        id: attempt.id,
        participantName: attempt.participant ? attempt.participant.name : "Anonyme",
        score: attempt.score,
        status: attempt.status,
        startedAt: attempt.startedAt,
        finishedAt: attempt.finishedAt,
        answers,
        questionOrder,
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
