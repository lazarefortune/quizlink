"use server";

import { isSelectionCorrect } from "@/lib/anonymous-quiz-scoring";
import { prisma } from "@/lib/prisma";
import { getQuestionImageSrc } from "@/lib/question-image-src";
import { resolveEffectiveQuizSettings } from "@/lib/quiz/resolveEffectiveQuizSettings";
import { playBlockedErrorCodeForQuizStatus } from "@/lib/quiz/quizActionErrorCodes";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

export type AnonymousQuizOptionPublic = {
  id: string;
  label: string;
};

export type AnonymousQuizQuestionPublic = {
  id: string;
  type: string;
  label: string;
  image: string | null;
  imageKey: string | null;
  explanation: string | null;
  order: number;
  options: AnonymousQuizOptionPublic[];
};

export type AnonymousQuizPlaySettings = {
  showAnswerImmediately: boolean;
  showAnswersAtEnd: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  timeLimitPerQuestion: number | null;
};

export type GetAnonymousQuizPlayDataResult =
  | {
      success: true;
      data: {
        quizId: string;
        quizName: string;
        settings: AnonymousQuizPlaySettings;
        allowMultipleAttempts: boolean;
        questions: AnonymousQuizQuestionPublic[];
      };
    }
  | { success: false; error: string };

/**
 * Read-only payload for anonymous play: no isCorrect on options.
 */
export async function getAnonymousQuizPlayData(
  token: string
): Promise<GetAnonymousQuizPlayDataResult> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const trimmed = token?.trim();
    if (!trimmed) {
      return { success: false, error: "Invalid token" };
    }

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

    if (!quizLink) {
      return { success: false, error: "Quiz link not found" };
    }

    if (quizLink.revokedAt) {
      return { success: false, error: "Quiz link has been revoked" };
    }

    if (quizLink.expiresAt && quizLink.expiresAt < new Date()) {
      return { success: false, error: "Quiz link has expired" };
    }

    const playBlocked = playBlockedErrorCodeForQuizStatus(
      quizLink.quiz.status as QuizLifecycleStatus,
    );
    if (playBlocked) {
      return { success: false, error: playBlocked };
    }

    if (quizLink.participantId !== null) {
      return { success: false, error: "This link requires a participant session" };
    }

    const settings = resolveEffectiveQuizSettings(quizLink.quiz.settings);

    const questions: AnonymousQuizQuestionPublic[] = quizLink.quiz.questions.map(
      (q) => ({
        id: q.id,
        type: q.type,
        label: q.label,
        image: q.image,
        imageKey: q.imageKey,
        explanation: q.explanation,
        order: q.order,
        options: q.options.map((opt) => ({
          id: opt.id,
          label: opt.label,
        })),
      })
    );

    return {
      success: true,
      data: {
        quizId: quizLink.quiz.id,
        quizName: quizLink.quiz.name,
        settings,
        allowMultipleAttempts: quizLink.allowMultipleAttempts,
        questions,
      },
    };
  } catch (e) {
    console.error("getAnonymousQuizPlayData:", e);
    return { success: false, error: "Failed to load quiz" };
  }
}

type ValidateQuestionResult =
  | {
      success: true;
      isCorrect: boolean;
      correctOptionIds?: string[];
      explanation?: string | null;
    }
  | { success: false; error: string };

/**
 * Validate one answer for anonymous play (no writes). Returns correct option ids only when
 * quiz has showAnswerImmediately (same contract as persisted submitAnswer).
 */
export async function validateAnonymousQuestionAnswer(
  token: string,
  questionId: string,
  selectedOptionIds: string[],
  timeSpent?: number
): Promise<ValidateQuestionResult> {
  void timeSpent;
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const trimmed = token?.trim();
    if (!trimmed) {
      return { success: false, error: "Invalid token" };
    }

    const quizLink = await prisma.quizLink.findUnique({
      where: { token: trimmed },
      include: {
        quiz: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
      },
    });

    if (!quizLink || quizLink.revokedAt) {
      return { success: false, error: "Quiz link not found" };
    }

    if (quizLink.expiresAt && quizLink.expiresAt < new Date()) {
      return { success: false, error: "Quiz link has expired" };
    }

    const validateBlocked = playBlockedErrorCodeForQuizStatus(
      quizLink.quiz.status as QuizLifecycleStatus,
    );
    if (validateBlocked) {
      return { success: false, error: validateBlocked };
    }

    if (quizLink.participantId !== null) {
      return { success: false, error: "Invalid link mode" };
    }

    const question = quizLink.quiz.questions.find((q) => q.id === questionId);
    if (!question) {
      return { success: false, error: "Question not found" };
    }

    if (!selectedOptionIds || selectedOptionIds.length === 0) {
      return { success: false, error: "Aucune réponse sélectionnée" };
    }

    const validOptionIds = new Set(question.options.map((o) => o.id));
    const invalid = selectedOptionIds.filter((id) => !validOptionIds.has(id));
    if (invalid.length > 0) {
      return { success: false, error: "Options invalides sélectionnées" };
    }

    const isCorrect = isSelectionCorrect(selectedOptionIds, question.options);
    const settings = quizLink.quiz.settings as { showAnswerImmediately?: boolean };

    const correctOptionIds = question.options
      .filter((o) => o.isCorrect)
      .map((o) => o.id);

    return {
      success: true,
      isCorrect,
      correctOptionIds: settings.showAnswerImmediately ? correctOptionIds : undefined,
      explanation:
        settings.showAnswerImmediately && !isCorrect
          ? question.explanation
          : undefined,
    };
  } catch (e) {
    console.error("validateAnonymousQuestionAnswer:", e);
    return { success: false, error: "Validation failed" };
  }
}

export type AnonymousAnswerInput = {
  questionId: string;
  selectedOptionIds: string[];
};

export type AnonymousQuizDetailRow = {
  questionId: string;
  questionLabel: string;
  questionImage: string | null;
  isCorrect: boolean;
  selectedOptionIds: string[];
  selectedOptionLabels: string[];
  correctOptionIds: string[];
  correctOptionLabels: string[];
  explanation: string | null;
};

export type ValidateAnonymousQuizAnswersResult =
  | {
      success: true;
      score: number;
      totalQuestions: number;
      correctAnswersCount: number;
      durationSec?: number;
      /**
       * Mirror of quiz `showAnswersAtEnd` setting so the client can decide whether to render
       * per-question details. When false, `details` will be stripped of correct answers and
       * explanations.
       */
      showAnswersAtEnd: boolean;
      details: AnonymousQuizDetailRow[];
    }
  | { success: false; error: string };

/**
 * Full anonymous quiz validation at end (no writes).
 */
export async function validateAnonymousQuizAnswers(
  token: string,
  answers: AnonymousAnswerInput[],
  startedAtMs?: number
): Promise<ValidateAnonymousQuizAnswersResult> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const trimmed = token?.trim();
    if (!trimmed) {
      return { success: false, error: "Invalid token" };
    }

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

    if (!quizLink || quizLink.revokedAt) {
      return { success: false, error: "Quiz link not found" };
    }

    if (quizLink.expiresAt && quizLink.expiresAt < new Date()) {
      return { success: false, error: "Quiz link has expired" };
    }

    const batchBlocked = playBlockedErrorCodeForQuizStatus(
      quizLink.quiz.status as QuizLifecycleStatus,
    );
    if (batchBlocked) {
      return { success: false, error: batchBlocked };
    }

    if (quizLink.participantId !== null) {
      return { success: false, error: "Invalid link mode" };
    }

    const questions = quizLink.quiz.questions;
    const answerByQuestion = new Map(
      answers.map((a) => [a.questionId, a.selectedOptionIds])
    );

    const effectiveSettings = resolveEffectiveQuizSettings(quizLink.quiz.settings);
    const showAnswersAtEnd = effectiveSettings.showAnswersAtEnd;

    const details: AnonymousQuizDetailRow[] = [];
    let correctCount = 0;

    for (const question of questions) {
      const selectedOptionIds = answerByQuestion.get(question.id) ?? [];
      const validOptionIds = new Set(question.options.map((o) => o.id));
      const filtered = selectedOptionIds.filter((id) => validOptionIds.has(id));
      const correctOptionIds = question.options
        .filter((o) => o.isCorrect)
        .map((o) => o.id);

      const isCorrect =
        filtered.length > 0 && isSelectionCorrect(filtered, question.options);

      if (isCorrect) {
        correctCount += 1;
      }

      const optionById = new Map(question.options.map((o) => [o.id, o]));
      const selectedOptionLabels = filtered.map(
        (id) => optionById.get(id)?.label ?? ""
      );
      const correctOptionLabels = correctOptionIds.map(
        (id) => optionById.get(id)?.label ?? ""
      );

      // When `showAnswersAtEnd` is false, do not transmit correct answer labels/ids or
      // explanations to the client to avoid leaking them in the network response.
      details.push({
        questionId: question.id,
        questionLabel: question.label,
        questionImage: getQuestionImageSrc({
          image: question.image,
          imageKey: question.imageKey,
        }),
        isCorrect,
        selectedOptionIds: filtered,
        selectedOptionLabels,
        correctOptionIds: showAnswersAtEnd ? correctOptionIds : [],
        correctOptionLabels: showAnswersAtEnd ? correctOptionLabels : [],
        explanation: showAnswersAtEnd ? question.explanation : null,
      });
    }

    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    const durationSec =
      typeof startedAtMs === "number" && startedAtMs > 0
        ? Math.round((Date.now() - startedAtMs) / 1000)
        : undefined;

    return {
      success: true,
      score,
      totalQuestions,
      correctAnswersCount: correctCount,
      durationSec,
      showAnswersAtEnd,
      details,
    };
  } catch (e) {
    console.error("validateAnonymousQuizAnswers:", e);
    return { success: false, error: "Validation failed" };
  }
}
