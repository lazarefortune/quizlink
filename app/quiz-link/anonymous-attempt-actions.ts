"use server";

import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { abandonQuizAttemptById } from "@/lib/quiz/abandon-quiz-attempt";
import {
  clearAnonymousQuizAttemptCookie,
  setAnonymousQuizAttemptCookie,
} from "@/lib/quiz/quiz-attempt-cookie-server";
import { isSelectionCorrect, correctOptionIdsFromDbOptions } from "@/lib/anonymous-quiz-scoring";
import { getQuestionImageSrc } from "@/lib/question-image-src";
import { resolveEffectiveQuizSettings } from "@/lib/quiz/resolveEffectiveQuizSettings";
import { validateParticipantStartInput } from "@/lib/quiz/validate-participant-start-input";
import { playBlockedErrorCodeForQuizStatus } from "@/lib/quiz/quizActionErrorCodes";
import { getQuizLinkCampaignBlockError } from "@/lib/quiz/quizLinkCampaign";
import {
  ensureQuizLinkCampaignStarted,
  touchQuizLinkLastResponseAt,
} from "@/lib/quiz/quizLinkCampaignPersistence";
import {
  incrementQuestionAnswerAggregates,
  incrementQuizCompletedAggregate,
  incrementQuizStartedAggregate,
  transitionAttemptToCompleted,
} from "@/lib/quiz/quiz-response-aggregates";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StartAttemptResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

export type StartAttemptQuestionResult =
  | { success: true; startedAt: Date; deadlineAt: Date | null }
  | { success: false; error: string };

export type SubmitAttemptAnswerResult =
  | {
      success: true;
      isCorrect: boolean;
      expired: boolean;
      correctOptionIds?: string[];
      explanation?: string | null;
    }
  | { success: false; error: string };

export type AnonymousAttemptDetailRow = {
  questionId: string;
  questionLabel: string;
  questionImage: string | null;
  isCorrect: boolean;
  expired: boolean;
  selectedOptionIds: string[];
  selectedOptionLabels: string[];
  correctOptionIds: string[];
  correctOptionLabels: string[];
  explanation: string | null;
  timeSpentSeconds: number | null;
};

export type FinishAttemptResult =
  | {
      success: true;
      score: number;
      totalQuestions: number;
      correctAnswersCount: number;
      durationSec: number | null;
      showAnswersAtEnd: boolean;
      details: AnonymousAttemptDetailRow[];
    }
  | { success: false; error: string };

export type AbandonAttemptResult =
  | { success: true }
  | { success: false; error: string };

export type RemainingAnswer = {
  questionId: string;
  selectedOptionIds: string[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function resolveEligibleAnonymousAttemptLink(token: string) {
  if (!prisma) return { ok: false as const, error: "Database not initialized" };

  const trimmed = token?.trim();
  if (!trimmed) return { ok: false as const, error: "Invalid token" };

  const quizLink = await prisma.quizLink.findUnique({
    where: { token: trimmed },
    include: {
      quiz: {
        include: {
          questions: {
            include: { options: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!quizLink) return { ok: false as const, error: "Quiz link not found" };
  if (quizLink.revokedAt) return { ok: false as const, error: "Quiz link has been revoked" };
  if (quizLink.expiresAt && quizLink.expiresAt < new Date())
    return { ok: false as const, error: "Quiz link has expired" };
  if (quizLink.participantId !== null)
    return { ok: false as const, error: "This link requires a participant session" };

  const blocked = playBlockedErrorCodeForQuizStatus(
    quizLink.quiz.status as QuizLifecycleStatus,
  );
  if (blocked) return { ok: false as const, error: blocked };

  return { ok: true as const, quizLink };
}

// ---------------------------------------------------------------------------
// Action 1 – start attempt
// ---------------------------------------------------------------------------

/**
 * Creates a new anonymous QuizAttempt for a public quiz link.
 * Also bumps QuizLinkAnonymousStats.startedCount.
 */
export type StartAnonymousQuizAttemptInput = {
  participantName?: string;
  participantEmail?: string;
  hasConsent?: boolean;
};

export async function startAnonymousQuizAttemptAction(
  token: string,
  input?: StartAnonymousQuizAttemptInput,
): Promise<StartAttemptResult> {
  try {
    if (!prisma) return { success: false, error: "Database not initialized" };

    const resolved = await resolveEligibleAnonymousAttemptLink(token);
    if (!resolved.ok) return { success: false, error: resolved.error };

    const { quizLink } = resolved;
    const now = new Date();
    const campaignBlock = getQuizLinkCampaignBlockError(quizLink, now);
    if (campaignBlock) {
      return { success: false, error: campaignBlock };
    }

    const settings = resolveEffectiveQuizSettings(quizLink.quiz.settings);
    const validated = validateParticipantStartInput({
      identityMode: settings.participantIdentityMode,
      participantName: input?.participantName,
      participantEmail: input?.participantEmail,
      hasConsent: input?.hasConsent,
    });

    if (!validated.ok) {
      return { success: false, error: validated.error };
    }

    const totalQuestions = quizLink.quiz.questions.length;

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizLink: { connect: { id: quizLink.id } },
        status: "IN_PROGRESS",
        identityMode: validated.data.identityMode,
        participantName: validated.data.participantName,
        participantEmail: validated.data.participantEmail,
        totalQuestions,
      } as Prisma.QuizAttemptCreateInput,
    });

    await ensureQuizLinkCampaignStarted(quizLink.id, now);

    await incrementQuizStartedAggregate(quizLink.quizId);

    // Bump startedCount (best-effort, non-blocking)
    prisma.$executeRaw`
      INSERT INTO quiz_link_anonymous_stats (
        quiz_link_id, open_count, started_count, completed_count,
        score_sum, score_count, last_started_at, created_at, updated_at
      ) VALUES (
        ${quizLink.id}, 0, 1, 0, 0, 0, ${now},
        CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
      )
      ON DUPLICATE KEY UPDATE
        started_count = quiz_link_anonymous_stats.started_count + 1,
        last_started_at = ${now},
        updated_at = CURRENT_TIMESTAMP(3)
    `.catch((e: unknown) => console.error("startAnonymousQuizAttemptAction stats:", e));

    const trimmedToken = token.trim();
    await setAnonymousQuizAttemptCookie(trimmedToken, attempt.id);

    return { success: true, redirectTo: `/quiz/${trimmedToken}/play` };
  } catch (e) {
    console.error("startAnonymousQuizAttemptAction:", e);
    return { success: false, error: "Failed to start attempt" };
  }
}

// ---------------------------------------------------------------------------
// Action 2 – start question (server-side timing)
// ---------------------------------------------------------------------------

/**
 * Records the server-side start time for a question.
 * If the question was already started, returns the existing entry (no reset).
 * Returns deadlineAt so the client can display an accurate countdown.
 */
export async function startAttemptQuestionAction(
  attemptId: string,
  questionId: string,
): Promise<StartAttemptQuestionResult> {
  try {
    if (!prisma) return { success: false, error: "Database not initialized" };

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quizLink: {
          include: {
            quiz: {
              select: {
                status: true,
                settings: true,
                questions: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    if (!attempt) return { success: false, error: "Attempt not found" };
    if (attempt.status === "COMPLETED") return { success: false, error: "Quiz already completed" };
    if (attempt.status === "ABANDONED") return { success: false, error: "Quiz was abandoned" };

    const blocked = playBlockedErrorCodeForQuizStatus(
      attempt.quizLink.quiz.status as QuizLifecycleStatus,
    );
    if (blocked) return { success: false, error: blocked };

    // Verify question belongs to this quiz
    const questionExists = attempt.quizLink.quiz.questions.some((q) => q.id === questionId);
    if (!questionExists) return { success: false, error: "Question not found" };

    // If timing already exists, return it unchanged (anti-cheat: no reset)
    const existing = await prisma.quizAttemptQuestion.findUnique({
      where: { attemptId_questionId: { attemptId, questionId } },
    });
    if (existing) {
      return { success: true, startedAt: existing.startedAt, deadlineAt: existing.deadlineAt };
    }

    // Create new timing entry
    const settings = resolveEffectiveQuizSettings(attempt.quizLink.quiz.settings);
    const timeLimitPerQuestion = settings.timeLimitPerQuestion ?? null;

    const startedAt = new Date();
    const deadlineAt =
      timeLimitPerQuestion && timeLimitPerQuestion > 0
        ? new Date(startedAt.getTime() + timeLimitPerQuestion * 1000)
        : null;

    const timing = await prisma.quizAttemptQuestion.create({
      data: { attemptId, questionId, startedAt, deadlineAt },
    });

    return { success: true, startedAt: timing.startedAt, deadlineAt: timing.deadlineAt };
  } catch (e) {
    console.error("startAttemptQuestionAction:", e);
    return { success: false, error: "Failed to start question" };
  }
}

// ---------------------------------------------------------------------------
// Action 3 – submit answer
// ---------------------------------------------------------------------------

/**
 * Validates and persists a single answer.
 * Server checks the deadline — expired answers are marked incorrect.
 * Returns correctOptionIds only when showAnswerImmediately is true.
 */
export async function submitAttemptAnswerAction(
  attemptId: string,
  questionId: string,
  selectedOptionIds: string[],
): Promise<SubmitAttemptAnswerResult> {
  try {
    if (!prisma) return { success: false, error: "Database not initialized" };

    if (!selectedOptionIds || selectedOptionIds.length === 0) {
      return { success: false, error: "Aucune réponse sélectionnée" };
    }

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quizLink: {
          include: {
            quiz: {
              include: {
                questions: { include: { options: true } },
              },
            },
          },
        },
      },
    });

    if (!attempt) return { success: false, error: "Attempt not found" };
    if (attempt.status === "COMPLETED") return { success: false, error: "Quiz already completed" };
    if (attempt.status === "ABANDONED") return { success: false, error: "Quiz was abandoned" };

    const blocked = playBlockedErrorCodeForQuizStatus(
      attempt.quizLink.quiz.status as QuizLifecycleStatus,
    );
    if (blocked) return { success: false, error: blocked };

    const question = attempt.quizLink.quiz.questions.find((q) => q.id === questionId);
    if (!question) return { success: false, error: "Question not found" };

    // Validate option ids belong to this question
    const validOptionIds = new Set(question.options.map((o) => o.id));
    const invalid = selectedOptionIds.filter((id) => !validOptionIds.has(id));
    if (invalid.length > 0) return { success: false, error: "Options invalides sélectionnées" };

    // Server-side deadline check
    const timing = await prisma.quizAttemptQuestion.findUnique({
      where: { attemptId_questionId: { attemptId, questionId } },
    });

    const answeredAt = new Date();
    const expired =
      timing?.deadlineAt != null && answeredAt >= timing.deadlineAt;

    const isCorrect =
      !expired && isSelectionCorrect(selectedOptionIds, question.options);

    const correctOptionIds = correctOptionIdsFromDbOptions(question.options);

    // Persist / update timing record
    if (timing) {
      const timeSpentMs = answeredAt.getTime() - timing.startedAt.getTime();
      const cappedMs = timing.deadlineAt
        ? Math.min(timeSpentMs, timing.deadlineAt.getTime() - timing.startedAt.getTime())
        : timeSpentMs;
      const timeSpentSeconds = Math.max(0, Math.round(cappedMs / 1000));

      await prisma.quizAttemptQuestion.update({
        where: { id: timing.id },
        data: { answeredAt, timeSpentSeconds, expired },
      });

      // Persist answer (create or update)
      await upsertQuizAnswer({
        attemptId,
        questionId,
        selectedOptionIds,
        isCorrect,
        expired,
        answeredAt,
        timeSpent: timeSpentSeconds,
      });
    } else {
      // No timing record (quiz without timer or startAttemptQuestion not called)
      await upsertQuizAnswer({
        attemptId,
        questionId,
        selectedOptionIds,
        isCorrect,
        expired: false,
        answeredAt,
        timeSpent: null,
      });
    }

    const settings = attempt.quizLink.quiz.settings as {
      showAnswerImmediately?: boolean;
    };

    return {
      success: true,
      isCorrect,
      expired,
      correctOptionIds: settings.showAnswerImmediately ? correctOptionIds : undefined,
      explanation:
        settings.showAnswerImmediately && !isCorrect
          ? question.explanation
          : undefined,
    };
  } catch (e) {
    console.error("submitAttemptAnswerAction:", e);
    return { success: false, error: "Failed to submit answer" };
  }
}

async function upsertQuizAnswer(params: {
  attemptId: string;
  questionId: string;
  selectedOptionIds: string[];
  isCorrect: boolean;
  expired: boolean;
  answeredAt: Date;
  timeSpent: number | null;
}) {
  if (!prisma) return;
  const existing = await prisma.quizAnswer.findFirst({
    where: { attemptId: params.attemptId, questionId: params.questionId },
  });
  if (existing) {
    await prisma.quizAnswer.update({
      where: { id: existing.id },
      data: {
        selectedOptionIds: params.selectedOptionIds as Prisma.InputJsonValue,
        isCorrect: params.isCorrect,
        expired: params.expired,
        answeredAt: params.answeredAt,
        timeSpent: params.timeSpent,
      },
    });
  } else {
    await prisma.quizAnswer.create({
      data: {
        attemptId: params.attemptId,
        questionId: params.questionId,
        selectedOptionIds: params.selectedOptionIds as Prisma.InputJsonValue,
        isCorrect: params.isCorrect,
        expired: params.expired,
        answeredAt: params.answeredAt,
        timeSpent: params.timeSpent,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Action 4 – finish attempt
// ---------------------------------------------------------------------------

/**
 * Completes the attempt:
 * 1. Stores any remaining (unsubmitted) answers, checking deadlines.
 * 2. Calculates score server-side from all stored answers.
 * 3. Marks attempt COMPLETED with durationSeconds.
 * 4. Updates QuizLinkAnonymousStats.
 *
 * Returns a result mirroring validateAnonymousQuizAnswers for session storage.
 */
export async function finishAnonymousQuizAttemptAction(
  attemptId: string,
  remainingAnswers: RemainingAnswer[],
): Promise<FinishAttemptResult> {
  try {
    if (!prisma) return { success: false, error: "Database not initialized" };

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quizLink: {
          include: {
            quiz: {
              include: {
                questions: {
                  include: { options: true },
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
        answers: true,
        questionTimings: true,
      },
    });

    if (!attempt) return { success: false, error: "Attempt not found" };

    const blocked = playBlockedErrorCodeForQuizStatus(
      attempt.quizLink.quiz.status as QuizLifecycleStatus,
    );
    if (blocked) return { success: false, error: blocked };

    const questions = attempt.quizLink.quiz.questions;
    const settings = resolveEffectiveQuizSettings(attempt.quizLink.quiz.settings);
    const finishedAt = new Date();

    // Build maps for quick lookup
    const existingAnswersByQuestionId = new Map(
      attempt.answers.map((a) => [a.questionId, a]),
    );
    const timingByQuestionId = new Map(
      attempt.questionTimings.map((t) => [t.questionId, t]),
    );
    const remainingByQuestionId = new Map(
      remainingAnswers.map((a) => [a.questionId, a.selectedOptionIds]),
    );

    // If already completed, skip write phase
    if (attempt.status !== "COMPLETED") {
      // Store remaining answers
      for (const question of questions) {
        if (existingAnswersByQuestionId.has(question.id)) continue;

        const selectedOptionIds = remainingByQuestionId.get(question.id) ?? [];
        if (selectedOptionIds.length === 0) continue; // unanswered → skip (counted as incorrect below)

        const timing = timingByQuestionId.get(question.id);
        const answeredAt = finishedAt;
        const expired = timing?.deadlineAt != null && answeredAt >= timing.deadlineAt;

        // Validate option ids (server-side safety check)
        const validOptionIds = new Set(question.options.map((o) => o.id));
        const filtered = selectedOptionIds.filter((id) => validOptionIds.has(id));

        const isCorrect =
          !expired && filtered.length > 0 && isSelectionCorrect(filtered, question.options);

        let timeSpentSeconds: number | null = null;
        if (timing) {
          const rawMs = answeredAt.getTime() - timing.startedAt.getTime();
          const cappedMs = timing.deadlineAt
            ? Math.min(rawMs, timing.deadlineAt.getTime() - timing.startedAt.getTime())
            : rawMs;
          timeSpentSeconds = Math.max(0, Math.round(cappedMs / 1000));

          await prisma.quizAttemptQuestion.update({
            where: { id: timing.id },
            data: { answeredAt, timeSpentSeconds, expired },
          });
        }

        await prisma.quizAnswer.create({
          data: {
            attemptId,
            questionId: question.id,
            selectedOptionIds: filtered as Prisma.InputJsonValue,
            isCorrect,
            expired,
            answeredAt,
            timeSpent: timeSpentSeconds,
          },
        });

        // Refresh local map
        existingAnswersByQuestionId.set(question.id, {
          id: "",
          attemptId,
          questionId: question.id,
          selectedOptionIds: filtered,
          isCorrect,
          expired,
          answeredAt,
          timeSpent: timeSpentSeconds,
        } as typeof attempt.answers[0]);
      }

      // Compute score
      const totalQuestions = questions.length;
      const correctAnswers = [...existingAnswersByQuestionId.values()].filter(
        (a) => a.isCorrect,
      ).length;
      const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      const durationSeconds = Math.max(
        0,
        Math.round((finishedAt.getTime() - attempt.startedAt.getTime()) / 1000),
      );

      const transitioned = await transitionAttemptToCompleted(attemptId, {
        finishedAt,
        score,
        durationSeconds,
        totalQuestions,
      });

      if (transitioned) {
        const quizId = attempt.quizLink.quiz.id;

        await incrementQuizCompletedAggregate(quizId, {
          score,
          totalQuestions,
          durationSeconds,
        });

        const aggregateAnswers = [...existingAnswersByQuestionId.values()].map((answer) => ({
          questionId: answer.questionId,
          isCorrect: answer.isCorrect,
          expired: answer.expired,
          timeSpentSeconds: answer.timeSpent,
        }));

        await incrementQuestionAnswerAggregates(quizId, aggregateAnswers);
      }

      if (transitioned) {
        // Update QuizLinkAnonymousStats (best-effort)
        prisma.$executeRaw`
          INSERT INTO quiz_link_anonymous_stats (
            quiz_link_id, open_count, started_count, completed_count,
            score_sum, score_count, best_score, lowest_score,
            last_completed_at, created_at, updated_at
          ) VALUES (
            ${attempt.quizLinkId}, 0, 0, 1,
            ${score}, 1, ${score}, ${score},
            ${finishedAt},
            CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
          )
          ON DUPLICATE KEY UPDATE
            completed_count = quiz_link_anonymous_stats.completed_count + 1,
            score_count = quiz_link_anonymous_stats.score_count + 1,
            score_sum = quiz_link_anonymous_stats.score_sum + ${score},
            best_score = GREATEST(COALESCE(quiz_link_anonymous_stats.best_score, ${score}), ${score}),
            lowest_score = LEAST(COALESCE(quiz_link_anonymous_stats.lowest_score, ${score}), ${score}),
            last_completed_at = ${finishedAt},
            updated_at = CURRENT_TIMESTAMP(3)
        `.catch((e: unknown) => console.error("finishAnonymousQuizAttemptAction stats:", e));

        await touchQuizLinkLastResponseAt(attempt.quizLinkId, finishedAt);
      }
    }

    // Reload updated answers from DB for result building
    const finalAnswers = await prisma.quizAnswer.findMany({
      where: { attemptId },
    });
    const finalAnswersByQuestionId = new Map(finalAnswers.map((a) => [a.questionId, a]));
    const finalTimings = await prisma.quizAttemptQuestion.findMany({
      where: { attemptId },
    });
    const finalTimingByQuestionId = new Map(finalTimings.map((t) => [t.questionId, t]));

    const updatedAttempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      select: { score: true, startedAt: true, finishedAt: true, durationSeconds: true },
    });

    const totalQuestions = questions.length;
    const correctAnswersCount = finalAnswers.filter((a) => a.isCorrect).length;
    const score =
      updatedAttempt?.score ??
      (totalQuestions > 0 ? (correctAnswersCount / totalQuestions) * 100 : 0);

    const durationSec =
      updatedAttempt?.durationSeconds ??
      (updatedAttempt?.finishedAt && updatedAttempt?.startedAt
        ? Math.round(
            (updatedAttempt.finishedAt.getTime() - updatedAttempt.startedAt.getTime()) / 1000,
          )
        : null);

    // Build details respecting showAnswersAtEnd
    const details: AnonymousAttemptDetailRow[] = questions.map((question) => {
      const answer = finalAnswersByQuestionId.get(question.id);
      const timing = finalTimingByQuestionId.get(question.id);

      const rawSelected = Array.isArray(answer?.selectedOptionIds)
        ? (answer.selectedOptionIds as string[])
        : [];
      const validIds = new Set(question.options.map((o) => o.id));
      const selectedOptionIds = rawSelected.filter((id) => validIds.has(id));

      const correctOptionIds = settings.showAnswersAtEnd
        ? correctOptionIdsFromDbOptions(question.options)
        : [];

      const optionById = new Map(question.options.map((o) => [o.id, o]));
      const selectedOptionLabels = selectedOptionIds.map((id) => optionById.get(id)?.label ?? "");
      const correctOptionLabels = correctOptionIds.map((id) => optionById.get(id)?.label ?? "");

      return {
        questionId: question.id,
        questionLabel: question.label,
        questionImage: getQuestionImageSrc({ image: question.image, imageKey: question.imageKey }),
        isCorrect: answer?.isCorrect ?? false,
        expired: answer?.expired ?? false,
        selectedOptionIds,
        selectedOptionLabels,
        correctOptionIds,
        correctOptionLabels,
        explanation: settings.showAnswersAtEnd ? question.explanation : null,
        timeSpentSeconds: timing?.timeSpentSeconds ?? null,
      };
    });

    const linkToken = attempt.quizLink.token?.trim();
    if (linkToken) {
      await clearAnonymousQuizAttemptCookie(linkToken);
    }

    return {
      success: true,
      score,
      totalQuestions,
      correctAnswersCount,
      durationSec,
      showAnswersAtEnd: settings.showAnswersAtEnd,
      details,
    };
  } catch (e) {
    console.error("finishAnonymousQuizAttemptAction:", e);
    return { success: false, error: "Failed to finish attempt" };
  }
}

// ---------------------------------------------------------------------------
// Action 5 – abandon attempt (voluntary quit)
// ---------------------------------------------------------------------------

/**
 * Marks a public anonymous attempt as ABANDONED when the player quits voluntarily.
 * Idempotent if already COMPLETED or ABANDONED.
 */
export async function abandonQuizAttemptAction(
  attemptId: string,
): Promise<AbandonAttemptResult> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const linkToken = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      select: { quizLink: { select: { token: true } } },
    });

    const result = await abandonQuizAttemptById(attemptId);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const token = linkToken?.quizLink.token;
    if (token) {
      await clearAnonymousQuizAttemptCookie(token);
    }

    return { success: true };
  } catch (e) {
    console.error("abandonQuizAttemptAction:", e);
    return { success: false, error: "Failed to abandon attempt" };
  }
}
