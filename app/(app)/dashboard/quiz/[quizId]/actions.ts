"use server";

import type { Prisma, QuizLinkAnonymousStats } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { mergeParticipantIdentityIntoStoredSettings } from "@/lib/quiz/mergeParticipantIdentityIntoStoredSettings";
import {
  isParticipantIdentityMode,
  type ParticipantIdentityMode,
} from "@/types/participant-identity";
import { creatorCountedAttemptWhere } from "@/lib/creator-quiz-attempt-filter";
import {
  aggregateQuestionInsights,
  type QuestionInsight,
} from "@/lib/dashboard/aggregate-question-insights";
import {
  ATTEMPT_DETAILS_ERROR,
  buildCreatorResponseAttemptWhere,
  computeCreatorResponseStats,
  computeLockedAttemptCount,
  creatorResponseAttemptListSelect,
  formatAnonymousParticipantLabel,
  mapPrismaAttemptToCreatorRecord,
  buildAnonymousAttemptIndexMap,
  mapAttemptsToDetailRows,
  resolveAttemptDetailsPurged,
  type QuizDetailAttemptRow,
} from "@/lib/dashboard/creator-response-attempts";
import { getQuizAccessState } from "@/lib/quiz/getQuizAccessState";
import { buildQuizDetailCampaignSnapshot } from "@/lib/quiz/quizLinkCampaign";
import { getQuizResponseAggregates } from "@/lib/quiz/quiz-response-aggregates";
import { resolveQuizSimpleKpis } from "@/lib/quiz/resolveQuizSimpleKpis";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

type QuizSettings = {
  showAnswerImmediately?: boolean;
  showAnswersAtEnd?: boolean;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
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
        /** Mean duration (seconds) across completed identified attempts with start/end. */
        globalAverageDurationSeconds: number | null;
        quizDetails: {
          visibility: string;
          status: QuizLifecycleStatus;
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
        completionRatePercent: number;
        totalAttemptCount: number;
        lockedAttemptCount: number;
        purgedAttemptCount: number;
        hasPurgedDetails: boolean;
        detailsFullyPurged: boolean;
        attempts: QuizDetailAttemptRow[];
        campaign: ReturnType<typeof buildQuizDetailCampaignSnapshot> | null;
      };
    }
  | { success: false; error: string };

type GetQuizQuestionInsightsResponse =
  | { success: true; insights: QuestionInsight[] }
  | { success: false; error: string };

export type GetAttemptDetailsResponse =
  | {
      success: true;
      attempt: {
        id: string;
        participantName: string;
        participantEmail: string | null;
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
          expired: boolean;
          timeSpent: number | null;
        }>;
        questionOrder?: Array<{ id: string; order: number }>;
      };
    }
  | { success: false; error: string };

export type UpdateQuizParticipantIdentityModeResult =
  | { success: true; participantIdentityMode: ParticipantIdentityMode }
  | { success: false; error: string };

/**
 * Updates only quiz.settings.participantIdentityMode (owner-only, no question touch).
 */
export async function updateQuizParticipantIdentityModeAction(
  quizId: string,
  participantIdentityMode: string,
): Promise<UpdateQuizParticipantIdentityModeResult> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    if (!isParticipantIdentityMode(participantIdentityMode)) {
      return { success: false, error: "Invalid participant identity mode" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { ownerId: true, settings: true },
    });

    if (!quiz) {
      return { success: false, error: "Quiz not found" };
    }

    if (quiz.ownerId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    const nextSettings = mergeParticipantIdentityIntoStoredSettings(
      quiz.settings,
      participantIdentityMode,
    );

    await prisma.quiz.update({
      where: { id: quizId },
      data: {
        settings: nextSettings as Prisma.InputJsonValue,
      },
    });

    revalidatePath(`/dashboard/quiz/${quizId}`);
    revalidatePath(`/dashboard/quiz/${quizId}/success`);

    return { success: true, participantIdentityMode };
  } catch (error) {
    console.error("updateQuizParticipantIdentityModeAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update participant identity mode",
    };
  }
}

export type QuizContentQuestion = {
  id: string;
  order: number;
  type: string;
  label: string;
  image: string | null;
  imageKey: string | null;
  explanation: string | null;
  options: Array<{ id: string; label: string; isCorrect: boolean }>;
};

export type GetQuizContentResponse =
  | {
      success: true;
      quiz: {
        name: string;
        visibility: string;
        status: QuizLifecycleStatus;
        publishedAt: string | null;
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
        status: true,
        publishedAt: true,
        ownerId: true,
        questions: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            order: true,
            type: true,
            label: true,
            image: true,
            imageKey: true,
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
        status: quiz.status,
        publishedAt: quiz.publishedAt ? quiz.publishedAt.toISOString() : null,
        questions: quiz.questions.map((q) => ({
          id: q.id,
          order: q.order,
          type: q.type,
          label: q.label,
          image: q.image,
          imageKey: q.imageKey,
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
        status: true,
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

    const responseWhere = buildCreatorResponseAttemptWhere(quizId);
    const now = new Date();

    const publicQuizLink = await prisma.quizLink.findFirst({
      where: { quizId, participantId: null },
      select: {
        responsesStartedAt: true,
        acceptingResponsesUntil: true,
        detailsVisibleUntil: true,
        unlockedUntil: true,
        detailsPurgedAt: true,
      },
    });

    const accessState = await getQuizAccessState({
      quizId,
      userId: session.user.id,
      now,
    });

    const campaign = buildQuizDetailCampaignSnapshot(
      publicQuizLink,
      accessState,
      now,
    );

    const detailedPreviewLimit = campaign?.detailedPreviewLimit ?? 3;
    const detailsFullyPurged = publicQuizLink?.detailsPurgedAt != null;
    const showAllAttemptsInList = accessState.isUnlocked || detailsFullyPurged;

    // Attempt rows power preview list, audience breakdown and best/worst scores.
    // Simple KPIs (totals, averages, completion rate) come from quiz_response_stats when available.
    const [totalAttemptCount, statsAttemptRows, previewAttemptRows, anonymousIndexRows, responseAggregates] =
      await Promise.all([
        prisma.quizAttempt.count({ where: responseWhere }),
        prisma.quizAttempt.findMany({
          where: responseWhere,
          select: creatorResponseAttemptListSelect,
        }),
        prisma.quizAttempt.findMany({
          where: responseWhere,
          select: creatorResponseAttemptListSelect,
          orderBy: { startedAt: "asc" },
          ...(showAllAttemptsInList ? {} : { take: detailedPreviewLimit }),
        }),
        prisma.quizAttempt.findMany({
          where: {
            ...responseWhere,
            identityMode: "ANONYMOUS",
          },
          select: { id: true, startedAt: true },
        }),
        getQuizResponseAggregates(quizId),
      ]);

    const statsAttempts = statsAttemptRows.map(mapPrismaAttemptToCreatorRecord);
    const responseStats = computeCreatorResponseStats(statsAttempts);
    const purgedAttemptCount = statsAttempts.filter((attempt) =>
      resolveAttemptDetailsPurged(
        attempt.quizLinkDetailsPurgedAt,
        attempt.questionsAnswered,
      ),
    ).length;
    const hasPurgedDetails =
      publicQuizLink?.detailsPurgedAt != null || purgedAttemptCount > 0;

    const anonymousIndexMap = buildAnonymousAttemptIndexMap(anonymousIndexRows);
    const previewAttempts = mapAttemptsToDetailRows(
      previewAttemptRows.map(mapPrismaAttemptToCreatorRecord),
      anonymousIndexMap,
    );

    const attempts = previewAttempts.sort(
      (a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
    );

    const isUnlocked = accessState.isUnlocked;
    const lockedAttemptCount = detailsFullyPurged
      ? 0
      : computeLockedAttemptCount(
          totalAttemptCount,
          attempts.length,
          isUnlocked,
        );

    const simpleKpis = resolveQuizSimpleKpis(
      responseAggregates,
      responseStats,
      Math.max(anonymousStartedCount, identifiedAttemptsCount),
    );

    const totalResponses = simpleKpis.totalResponses;
    const totalStarted = simpleKpis.totalStarted;
    const totalOpenCount = anonymousOpenCount;

    const globalScoreAverage = simpleKpis.globalScoreAverage;
    const globalBestScore = responseStats.bestScore;
    const globalLowestScore = responseStats.lowestScore;
    const globalAverageDurationSeconds = simpleKpis.globalAverageDurationSeconds;
    const completionRatePercent = simpleKpis.completionRatePercent;

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

    const completionRate = completionRatePercent;

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

    const settings = (quiz.settings ?? {}) as QuizSettings;

    return {
      success: true,
      stats: {
        totalInvitations,
        enrolledParticipantsCount,
        totalParticipants,
        totalAttempts,
        completedAttempts: identifiedCompletedCount,
        averageScore,
        completionRate,
        totalQuestions: quiz._count.questions,
        anonymousCompletedCount: responseStats.anonymousCompletedCount,
        anonymousStartedCount,
        anonymousOpenCount,
        anonymousScoreCount,
        anonymousBestScore,
        anonymousLowestScore,
        identifiedCompletedCount: responseStats.identifiedCompletedCount,
        identifiedAttemptsCount,
        identifiedScoreCount,
        identifiedBestScore,
        identifiedLowestScore,
        totalResponses,
        totalStarted,
        totalOpenCount,
        globalScoreAverage,
        globalScoredCount: simpleKpis.globalScoredCount,
        globalBestScore,
        globalLowestScore,
        globalAverageDurationSeconds,
        completionRatePercent,
        quizDetails: {
          visibility: quiz.visibility,
          status: quiz.status,
          settings,
          createdAt: quiz.createdAt,
        },
        participants,
        totalAttemptCount,
        lockedAttemptCount,
        purgedAttemptCount,
        hasPurgedDetails,
        detailsFullyPurged,
        attempts,
        campaign,
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
 * Per-question insights from completed identified attempts (anonymous detail is not stored).
 */
export async function getQuizQuestionInsights(
  quizId: string,
): Promise<GetQuizQuestionInsightsResponse> {
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
        ownerId: true,
        questions: {
          orderBy: { order: "asc" },
          select: {
            id: true,
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

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        status: "COMPLETED",
        ...buildCreatorResponseAttemptWhere(quizId),
      },
      select: {
        answers: {
          select: {
            questionId: true,
            isCorrect: true,
            expired: true,
            timeSpent: true,
            selectedOptionIds: true,
          },
        },
      },
    });

    const answers = attempts.flatMap((attempt) =>
      attempt.answers.map((answer) => {
        const rawSelected = Array.isArray(answer.selectedOptionIds)
          ? answer.selectedOptionIds
          : [];
        const selectedOptionIds = rawSelected.filter(
          (id): id is string => typeof id === "string",
        );
        return {
          questionId: answer.questionId,
          isCorrect: answer.isCorrect,
          expired: answer.expired,
          timeSpent: answer.timeSpent,
          selectedOptionIds,
        };
      }),
    );

    const insights = aggregateQuestionInsights(quiz.questions, answers);
    return { success: true, insights };
  } catch (error) {
    console.error("Error getting quiz question insights:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get question insights",
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

    if (
      resolveAttemptDetailsPurged(
        attempt.quizLink.detailsPurgedAt,
        attempt.answers.length,
      )
    ) {
      return { success: false, error: ATTEMPT_DETAILS_ERROR.PURGED };
    }

    const quizId = attempt.quizLink.quizId;
    const publicQuizLink = await prisma.quizLink.findFirst({
      where: { quizId, participantId: null },
      select: {
        responsesStartedAt: true,
        acceptingResponsesUntil: true,
        detailsVisibleUntil: true,
        unlockedUntil: true,
      },
    });

    const now = new Date();
    const accessState = await getQuizAccessState({
      quizId,
      userId: session.user.id,
      now,
    });

    if (!accessState.isUnlocked) {
      const detailedLimit = publicQuizLink
        ? buildQuizDetailCampaignSnapshot(publicQuizLink, accessState, now)
            ?.detailedPreviewLimit ?? 3
        : 3;
      const visibleRows = await prisma.quizAttempt.findMany({
        where: buildCreatorResponseAttemptWhere(quizId),
        orderBy: { startedAt: "asc" },
        take: detailedLimit,
        select: { id: true },
      });
      const isVisible = visibleRows.some((row) => row.id === attemptId);
      if (!isVisible) {
        return { success: false, error: ATTEMPT_DETAILS_ERROR.LOCKED };
      }
    }

    let participantName = attempt.participant?.name ?? "Participant anonyme";
    let participantEmail: string | null = attempt.participant?.email ?? null;

    if (attempt.participantId == null) {
      if (attempt.identityMode === "ANONYMOUS") {
        const anonymousAttempts = await prisma.quizAttempt.findMany({
          where: {
            quizLink: { quizId: attempt.quizLink.quizId },
            identityMode: "ANONYMOUS",
          },
          select: { id: true, startedAt: true },
          orderBy: { startedAt: "asc" },
        });
        const index = buildAnonymousAttemptIndexMap(anonymousAttempts).get(attempt.id);
        participantName = formatAnonymousParticipantLabel(index ?? 0);
        participantEmail = null;
      } else if (attempt.identityMode === "NAME_EMAIL") {
        participantName = attempt.participantName?.trim() || "—";
        participantEmail = attempt.participantEmail?.trim() || null;
      } else if (attempt.identityMode === "PSEUDONYM") {
        participantName = attempt.participantName?.trim() || "—";
        participantEmail = null;
      }
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
        expired: answer.expired,
        timeSpent: answer.timeSpent,
      };
    });

    const quiz = attempt.quizLink.quiz as {
      ownerId: string;
      questions: Array<{ id: string; order: number }>;
    };
    const questionOrder = quiz.questions?.map((q) => ({ id: q.id, order: q.order })) ?? [];

    return {
      success: true,
      attempt: {
        id: attempt.id,
        participantName,
        participantEmail,
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
