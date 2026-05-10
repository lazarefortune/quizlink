"use server";

import type { QuizLinkAnonymousStats } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { creatorCountedAttemptWhere } from "@/lib/creator-quiz-attempt-filter";

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
        /** Completed anonymous plays (aggregated per public link). */
        anonymousCompletedCount: number;
        anonymousStartedCount: number;
        anonymousOpenCount: number;
        anonymousScoreCount: number;
        anonymousBestScore: number | null;
        anonymousLowestScore: number | null;
        /** Completed identified attempts only. */
        identifiedCompletedCount: number;
        identifiedAttemptsCount: number;
        identifiedScoreCount: number;
        identifiedBestScore: number | null;
        identifiedLowestScore: number | null;
        /** anonymousCompletedCount + identifiedCompletedCount */
        totalResponses: number;
        /** anonymousStartedCount + identifiedAttemptsCount */
        totalStarted: number;
        /** Sum of openCount on anonymous links only. */
        totalOpenCount: number;
        globalScoreAverage: number;
        /** Count of completed plays with a recorded score (anonymous + identified). */
        globalScoredCount: number;
        globalBestScore: number | null;
        globalLowestScore: number | null;
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
          where: { ...creatorCountedAttemptWhere },
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

    const identifiedAttempts = quizLinks.flatMap((link) => link.attempts as RawAttempt[]);
    const completedAttempts = identifiedAttempts.filter(
      (a) => a.status === "COMPLETED"
    );

    const identifiedCompletedCount = completedAttempts.length;
    const identifiedAttemptsCount = identifiedAttempts.length;

    const identifiedScoredCompleted = completedAttempts.filter(
      (a) => a.score != null && Number.isFinite(a.score)
    );
    const identifiedScoreCount = identifiedScoredCompleted.length;
    const identifiedScoreSum = identifiedScoredCompleted.reduce(
      (sum, a) => sum + (a.score as number),
      0
    );
    const identifiedBestScore =
      identifiedScoredCompleted.length > 0
        ? Math.max(...identifiedScoredCompleted.map((a) => a.score as number))
        : null;
    const identifiedLowestScore =
      identifiedScoredCompleted.length > 0
        ? Math.min(...identifiedScoredCompleted.map((a) => a.score as number))
        : null;

    const anonymousLinkIds = quizLinks
      .filter((link: { participantId: string | null }) => link.participantId === null)
      .map((link: { id: string }) => link.id);

    let anonymousStatsRows: QuizLinkAnonymousStats[] = [];

    if (anonymousLinkIds.length > 0) {
      try {
        anonymousStatsRows = await prisma.quizLinkAnonymousStats.findMany({
          where: { quizLinkId: { in: anonymousLinkIds } },
        });
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[getQuizStats] Could not load quiz_link_anonymous_stats. Run `pnpm prisma generate` and apply migrations.",
            error,
          );
        }
        anonymousStatsRows = [];
      }
    }

    const anonymousOpenCount = anonymousStatsRows.reduce((s, r) => s + r.openCount, 0);
    const anonymousStartedCount = anonymousStatsRows.reduce((s, r) => s + r.startedCount, 0);
    const anonymousCompletedCount = anonymousStatsRows.reduce(
      (s, r) => s + r.completedCount,
      0
    );
    const anonymousScoreSum = anonymousStatsRows.reduce((s, r) => s + r.scoreSum, 0);
    const anonymousScoreCount = anonymousStatsRows.reduce((s, r) => s + r.scoreCount, 0);

    const anonymousBestCandidates = anonymousStatsRows
      .map((r) => r.bestScore)
      .filter((v): v is number => v != null && Number.isFinite(v));
    const anonymousBestScore =
      anonymousBestCandidates.length > 0 ? Math.max(...anonymousBestCandidates) : null;

    const anonymousLowestCandidates = anonymousStatsRows
      .map((r) => r.lowestScore)
      .filter((v): v is number => v != null && Number.isFinite(v));
    const anonymousLowestScore =
      anonymousLowestCandidates.length > 0 ? Math.min(...anonymousLowestCandidates) : null;

    const totalResponses = anonymousCompletedCount + identifiedCompletedCount;
    const totalStarted = anonymousStartedCount + identifiedAttemptsCount;
    const totalOpenCount = anonymousOpenCount;

    const combinedScoreCount = anonymousScoreCount + identifiedScoreCount;
    const combinedScoreSum = anonymousScoreSum + identifiedScoreSum;
    const globalScoreAverage =
      combinedScoreCount > 0 ? combinedScoreSum / combinedScoreCount : 0;

    const globalBestCandidates = [anonymousBestScore, identifiedBestScore].filter(
      (v): v is number => v != null && Number.isFinite(v)
    );
    const globalBestScore =
      globalBestCandidates.length > 0 ? Math.max(...globalBestCandidates) : null;

    const globalLowestCandidates = [anonymousLowestScore, identifiedLowestScore].filter(
      (v): v is number => v != null && Number.isFinite(v)
    );
    const globalLowestScore =
      globalLowestCandidates.length > 0 ? Math.min(...globalLowestCandidates) : null;

    // Calculate stats
    const totalInvitations = quizLinks.length;
    const enrolledParticipantsCount = quizLinks.filter(
      (link: { participantId: string | null }) => link.participantId != null
    ).length;
    const uniqueParticipants = new Set(
      identifiedAttempts
        .map((a) => a.participantId)
        .filter((id): id is string => id !== null)
    );
    const totalParticipants = uniqueParticipants.size;
    const totalAttempts = identifiedAttemptsCount;

    const averageScore = globalScoreAverage;

    const completionRate =
      totalAttempts > 0
        ? (identifiedCompletedCount / totalAttempts) * 100
        : 0;

    // Get participants with stats (creator stats: identified attempts only)
    const participantsMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string | null;
        avatar: string | null;
        attempts: typeof identifiedAttempts;
      }
    >();

    identifiedAttempts.forEach((attempt) => {
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

    // Get attempts list (identified only; anonymous excluded from creator UI)
    const attempts = identifiedAttempts
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
          participantName: attempt.participant?.name ?? "",
          isAnonymous: false,
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
        anonymousAttemptsCount: anonymousCompletedCount,
        completedAttempts: identifiedCompletedCount,
        averageScore,
        completionRate,
        totalQuestions: quiz._count.questions,
        anonymousCompletedCount,
        anonymousStartedCount,
        anonymousOpenCount,
        anonymousScoreCount,
        anonymousBestScore,
        anonymousLowestScore,
        identifiedCompletedCount,
        identifiedAttemptsCount,
        identifiedScoreCount,
        identifiedBestScore,
        identifiedLowestScore,
        totalResponses,
        totalStarted,
        totalOpenCount,
        globalScoreAverage,
        globalScoredCount: combinedScoreCount,
        globalBestScore,
        globalLowestScore,
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

    if (!attempt.participantId) {
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
        participantName: attempt.participant?.name ?? "",
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
