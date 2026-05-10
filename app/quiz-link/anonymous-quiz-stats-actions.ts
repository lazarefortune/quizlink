"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export type RecordAnonymousStatsResult = { success: true } | { success: false; error: string };

type EligibleAnonymousLink = {
  id: string;
  quizId: string;
};

function revalidateQuizResultsPage(quizId: string): void {
  revalidatePath(`/dashboard/quiz/${quizId}`, "page");
}

async function resolveEligibleAnonymousQuizLink(
  token: string
): Promise<
  | { ok: true; quizLink: EligibleAnonymousLink }
  | { ok: false; error: string }
> {
  if (!prisma) {
    return { ok: false, error: "Database not initialized" };
  }

  const trimmed = token?.trim();
  if (!trimmed) {
    return { ok: false, error: "Invalid token" };
  }

  const quizLink = await prisma.quizLink.findUnique({
    where: { token: trimmed },
    select: {
      id: true,
      quizId: true,
      participantId: true,
      revokedAt: true,
      expiresAt: true,
    },
  });

  if (!quizLink) {
    return { ok: false, error: "Quiz link not found" };
  }

  if (quizLink.revokedAt) {
    return { ok: false, error: "Quiz link has been revoked" };
  }

  if (quizLink.expiresAt && quizLink.expiresAt < new Date()) {
    return { ok: false, error: "Quiz link has expired" };
  }

  if (quizLink.participantId !== null) {
    return { ok: false, error: "This link requires a participant session" };
  }

  return { ok: true, quizLink: { id: quizLink.id, quizId: quizLink.quizId } };
}

function assertValidCompletionScore(score: number): { ok: true } | { ok: false; error: string } {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return { ok: false, error: "Invalid score" };
  }

  if (score < 0 || score > 100) {
    return { ok: false, error: "Invalid score" };
  }

  return { ok: true };
}

/**
 * Public anonymous link viewed (intro). Increments openCount; no deduplication.
 */
export async function recordAnonymousLinkOpen(token: string): Promise<RecordAnonymousStatsResult> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const resolved = await resolveEligibleAnonymousQuizLink(token);
    if (!resolved.ok) {
      return { success: false, error: resolved.error };
    }

    const now = new Date();
    await prisma.$executeRaw`
      INSERT INTO quiz_link_anonymous_stats (
        quiz_link_id,
        open_count,
        started_count,
        completed_count,
        score_sum,
        score_count,
        last_opened_at,
        created_at,
        updated_at
      ) VALUES (
        ${resolved.quizLink.id},
        1,
        0,
        0,
        0,
        0,
        ${now},
        CURRENT_TIMESTAMP(3),
        CURRENT_TIMESTAMP(3)
      )
      ON DUPLICATE KEY UPDATE
        open_count = quiz_link_anonymous_stats.open_count + 1,
        last_opened_at = ${now},
        updated_at = CURRENT_TIMESTAMP(3)
    `;

    revalidateQuizResultsPage(resolved.quizLink.quizId);
    return { success: true };
  } catch (e) {
    console.error("recordAnonymousLinkOpen:", e);
    return { success: false, error: "Failed to record open" };
  }
}

/**
 * Anonymous play started (Commencer). Increments startedCount.
 */
export async function recordAnonymousQuizStart(token: string): Promise<RecordAnonymousStatsResult> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const resolved = await resolveEligibleAnonymousQuizLink(token);
    if (!resolved.ok) {
      return { success: false, error: resolved.error };
    }

    const now = new Date();
    await prisma.$executeRaw`
      INSERT INTO quiz_link_anonymous_stats (
        quiz_link_id,
        open_count,
        started_count,
        completed_count,
        score_sum,
        score_count,
        last_started_at,
        created_at,
        updated_at
      ) VALUES (
        ${resolved.quizLink.id},
        0,
        1,
        0,
        0,
        0,
        ${now},
        CURRENT_TIMESTAMP(3),
        CURRENT_TIMESTAMP(3)
      )
      ON DUPLICATE KEY UPDATE
        started_count = quiz_link_anonymous_stats.started_count + 1,
        last_started_at = ${now},
        updated_at = CURRENT_TIMESTAMP(3)
    `;

    revalidateQuizResultsPage(resolved.quizLink.quizId);
    return { success: true };
  } catch (e) {
    console.error("recordAnonymousQuizStart:", e);
    return { success: false, error: "Failed to record start" };
  }
}

/**
 * Anonymous quiz finished: updates completion and score aggregates (percentage 0–100).
 */
export async function recordAnonymousQuizCompletion(
  token: string,
  score: number
): Promise<RecordAnonymousStatsResult> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const scoreCheck = assertValidCompletionScore(score);
    if (!scoreCheck.ok) {
      return { success: false, error: scoreCheck.error };
    }

    const resolved = await resolveEligibleAnonymousQuizLink(token);
    if (!resolved.ok) {
      return { success: false, error: resolved.error };
    }

    const now = new Date();
    const s = score;

    await prisma.$executeRaw`
      INSERT INTO quiz_link_anonymous_stats (
        quiz_link_id,
        open_count,
        started_count,
        completed_count,
        score_sum,
        score_count,
        best_score,
        lowest_score,
        last_completed_at,
        created_at,
        updated_at
      ) VALUES (
        ${resolved.quizLink.id},
        0,
        0,
        1,
        ${s},
        1,
        ${s},
        ${s},
        ${now},
        CURRENT_TIMESTAMP(3),
        CURRENT_TIMESTAMP(3)
      )
      ON DUPLICATE KEY UPDATE
        completed_count = quiz_link_anonymous_stats.completed_count + 1,
        score_count = quiz_link_anonymous_stats.score_count + 1,
        score_sum = quiz_link_anonymous_stats.score_sum + ${s},
        best_score = GREATEST(COALESCE(quiz_link_anonymous_stats.best_score, ${s}), ${s}),
        lowest_score = LEAST(COALESCE(quiz_link_anonymous_stats.lowest_score, ${s}), ${s}),
        last_completed_at = ${now},
        updated_at = CURRENT_TIMESTAMP(3)
    `;

    revalidateQuizResultsPage(resolved.quizLink.quizId);
    return { success: true };
  } catch (e) {
    console.error("recordAnonymousQuizCompletion:", e);
    return { success: false, error: "Failed to record completion" };
  }
}
