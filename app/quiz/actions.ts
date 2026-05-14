"use server";

import { createQuizSession, getQuizSession, updateQuizSession } from "@/lib/quiz-session/quiz-session-store";
import { prisma } from "@/lib/prisma";
import type {
  StartQuizResponse,
  SubmitAnswerResponse,
  GetResultsResponse,
  PublicQuestion,
  PrivateAnswer,
  QuizSession,
} from "@/lib/quiz-session/quiz-session-types";
import type { Quiz, QuizSettings } from "@/types/quiz";
import type { Prisma } from "@prisma/client";
import { resolveEffectiveShuffleSettings } from "@/lib/quiz/shuffleSettings";

// Convert Quiz to session format
function convertQuizToSession(quiz: Quiz): {
  publicQuestions: PublicQuestion[];
  privateAnswers: PrivateAnswer[];
} {
  const publicQuestions: PublicQuestion[] = quiz.questions.map((q) => ({
    id: q.id,
    type: q.type,
    label: q.question,
    image: q.image,
    imageKey: q.imageKey,
    options: q.choices.map((choice, index) => ({
      id: `opt-${q.id}-${index}`,
      label: choice,
    })),
  }));

  const privateAnswers: PrivateAnswer[] = quiz.questions.map((q) => {
    const correctIndices = Array.isArray(q.correctAnswer)
      ? q.correctAnswer
      : [q.correctAnswer];

    return {
      questionId: q.id,
      correctOptionIds: correctIndices.map(
        (idx) => `opt-${q.id}-${idx}`
      ),
    };
  });

  return { publicQuestions, privateAnswers };
}

export async function startQuizAction(
  quiz: Quiz | (Partial<Quiz> & { id: string }),
  _participantName?: string
): Promise<StartQuizResponse> {
  try {
    // Check if quiz exists in database
    let dbQuiz = null;
    if (quiz.id && !quiz.id.startsWith("temp-") && !quiz.id.startsWith("quiz-")) {
      dbQuiz = await prisma.quiz.findUnique({
        where: { id: quiz.id },
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
      });
    }

    // If quiz exists in DB, use it; otherwise use in-memory session
    const quizSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    let publicQuestions: PublicQuestion[];
    let privateAnswers: PrivateAnswer[];
    let sessionQuizSettings: QuizSettings = {
      showAnswerImmediately: false,
      randomizeQuestions: false,
      randomizeOptions: false,
      timeLimitPerQuestion: null,
    };

    if (dbQuiz) {
      const rawSettings = (dbQuiz.settings ?? {}) as Record<string, unknown>;
      const shuffle = resolveEffectiveShuffleSettings({
        randomizeQuestions: Boolean(rawSettings.randomizeQuestions),
        randomizeOptions:
          typeof rawSettings.randomizeOptions === "boolean"
            ? rawSettings.randomizeOptions
            : undefined,
      });
      sessionQuizSettings = {
        showAnswerImmediately: Boolean(rawSettings.showAnswerImmediately),
        randomizeQuestions: shuffle.randomizeQuestions,
        randomizeOptions: shuffle.randomizeOptions,
        timeLimitPerQuestion:
          typeof rawSettings.timeLimitPerQuestion === "number"
            ? rawSettings.timeLimitPerQuestion
            : rawSettings.timeLimitPerQuestion === null
              ? null
              : null,
      };

      // Convert DB quiz to session format
      type DbQuestion = {
        id: string;
        type: string;
        label: string;
        image: string | null;
        imageKey: string | null;
        options: Array<{ id: string; label: string; isCorrect: boolean }>;
      };
      let questions = dbQuiz.questions.map((q: DbQuestion) => ({
        id: q.id,
        type: q.type as "MCQ" | "TRUE_FALSE" | "CHECKBOX",
        label: q.label,
        image: q.image || undefined,
        imageKey: q.imageKey || undefined,
        options: q.options.map((opt: { id: string; label: string; isCorrect: boolean }) => ({
          id: opt.id,
          label: opt.label,
          isCorrect: opt.isCorrect,
        })),
      }));

      if (sessionQuizSettings.randomizeQuestions) {
        questions = [...questions].sort(() => Math.random() - 0.5);
      }

      if (sessionQuizSettings.randomizeOptions) {
        questions = questions.map((q) => ({
          ...q,
          options: [...q.options].sort(() => Math.random() - 0.5),
        }));
      }

      publicQuestions = questions.map((q) => ({
        id: q.id,
        type: q.type,
        label: q.label,
        image: q.image,
        imageKey: q.imageKey,
        options: q.options.map((opt: { id: string; label: string; isCorrect: boolean }) => ({
          id: opt.id,
          label: opt.label,
        })),
      }));

      privateAnswers = questions.map((q) => ({
        questionId: q.id,
        correctOptionIds: q.options.filter((opt: { id: string; label: string; isCorrect: boolean }) => opt.isCorrect).map((opt: { id: string; label: string; isCorrect: boolean }) => opt.id),
      }));
    } else {
      if (quiz.settings) {
        const shuffle = resolveEffectiveShuffleSettings({
          randomizeQuestions: Boolean(quiz.settings.randomizeQuestions),
          randomizeOptions:
            typeof quiz.settings.randomizeOptions === "boolean"
              ? quiz.settings.randomizeOptions
              : undefined,
        });
        sessionQuizSettings = {
          showAnswerImmediately: Boolean(quiz.settings.showAnswerImmediately),
          randomizeQuestions: shuffle.randomizeQuestions,
          randomizeOptions: shuffle.randomizeOptions,
          timeLimitPerQuestion:
            quiz.settings.timeLimitPerQuestion === null ||
            typeof quiz.settings.timeLimitPerQuestion === "number"
              ? quiz.settings.timeLimitPerQuestion
              : null,
        };
      }

      // Use existing conversion for in-memory quizzes
      // Only convert if quiz has questions (complete Quiz object)
      if (quiz.questions && quiz.questions.length > 0) {
        const converted = convertQuizToSession(quiz as Quiz);
        publicQuestions = converted.publicQuestions;
        privateAnswers = converted.privateAnswers;
      } else {
        // Empty quiz - should not happen but handle gracefully
        publicQuestions = [];
        privateAnswers = [];
      }
    }

    const session: QuizSession = {
      id: quizSessionId,
      quizId: dbQuiz?.id || quiz.id || "",
      title: dbQuiz?.name || (quiz as Partial<Quiz> & { id: string }).title || "",
      settings: sessionQuizSettings,
      publicQuestions,
      privateAnswers,
      userAnswers: {},
      score: 0,
      createdAt: new Date(),
    };

    createQuizSession(session);

    // Note: QuizAttempt creation is now handled by the new token-based system
    // This function is kept for backward compatibility with in-memory quizzes

    return {
      success: true,
      quizSessionId,
      title: session.title,
      settings: session.settings,
      questions: session.publicQuestions,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to start quiz session",
    };
  }
}

export async function submitAnswerAction(
  quizSessionId: string,
  questionId: string,
  selectedOptionIds: string[]
): Promise<SubmitAnswerResponse> {
  try {
    const session = getQuizSession(quizSessionId);
    if (!session) {
      return {
        success: false,
        error: "Invalid quiz session",
      };
    }

    const question = session.publicQuestions.find((q) => q.id === questionId);
    if (!question) {
      return {
        success: false,
        error: "Invalid question ID",
      };
    }

    // Check if already answered
    if (questionId in session.userAnswers) {
      // Return existing result
      const privateAnswer = session.privateAnswers.find(
        (a) => a.questionId === questionId
      );
      if (!privateAnswer) {
        return {
          success: false,
          error: "Answer data not found",
        };
      }

      const userAnswerSet = new Set(session.userAnswers[questionId] || []);
      const correctAnswerSet = new Set(privateAnswer.correctOptionIds);
      const isCorrect =
        userAnswerSet.size === correctAnswerSet.size &&
        [...userAnswerSet].every((id) => correctAnswerSet.has(id));

      return {
        success: true,
        isCorrect,
        correctOptionIds:
          session.settings.showAnswerImmediately
            ? privateAnswer.correctOptionIds
            : undefined,
      };
    }

    // Validate input
    const validOptionIds = new Set(question.options.map((opt) => opt.id));
    const invalidOptions = selectedOptionIds.filter(
      (id) => !validOptionIds.has(id)
    );
    if (invalidOptions.length > 0) {
      return {
        success: false,
        error: "Invalid option IDs provided",
      };
    }

    // Store user answer
    session.userAnswers[questionId] = selectedOptionIds;

    // Find correct answer
    const privateAnswer = session.privateAnswers.find(
      (a) => a.questionId === questionId
    );
    if (!privateAnswer) {
      return {
        success: false,
        error: "Answer data not found",
      };
    }

    // Compare answers
    const userAnswerSet = new Set(selectedOptionIds);
    const correctAnswerSet = new Set(privateAnswer.correctOptionIds);
    const isCorrect =
      userAnswerSet.size === correctAnswerSet.size &&
      [...userAnswerSet].every((id) => correctAnswerSet.has(id));

    // Update score
    if (isCorrect) {
      session.score += 1;
    }

    updateQuizSession(quizSessionId, {
      userAnswers: { ...session.userAnswers },
      score: session.score,
    });

    // Save answer to database if attempt exists
    const sessionWithAttempt = session as QuizSession & { attemptId?: string };
    const attemptId = sessionWithAttempt.attemptId;
    if (attemptId) {
      await prisma.quizAnswer.create({
        data: {
          attemptId,
          questionId,
          selectedOptionIds: selectedOptionIds as Prisma.InputJsonValue,
          isCorrect,
        },
      });
    }

    return {
      success: true,
      isCorrect,
      correctOptionIds:
        session.settings.showAnswerImmediately
          ? privateAnswer.correctOptionIds
          : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to submit answer",
    };
  }
}

export async function getResultsAction(
  quizSessionId: string
): Promise<GetResultsResponse> {
  try {
    const session = getQuizSession(quizSessionId);
    if (!session) {
      return {
        success: false,
        error: "Invalid quiz session",
      };
    }

    const detailedResults = session.publicQuestions.map((question) => {
      const userAnswer = session.userAnswers[question.id] || [];
      const privateAnswer = session.privateAnswers.find(
        (a) => a.questionId === question.id
      );

      if (!privateAnswer) {
        return {
          questionId: question.id,
          isCorrect: false,
        };
      }

      const userAnswerSet = new Set(userAnswer);
      const correctAnswerSet = new Set(privateAnswer.correctOptionIds);
      const isCorrect =
        userAnswerSet.size === correctAnswerSet.size &&
        [...userAnswerSet].every((id) => correctAnswerSet.has(id));

      return {
        questionId: question.id,
        isCorrect,
      };
    });

    // Finalize attempt in database if it exists
    const attemptId = (session as QuizSession & { attemptId?: string }).attemptId;
    if (attemptId) {
      const totalQuestions = session.publicQuestions.length;
      const score = (session.score / totalQuestions) * 100;

      await prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          finishedAt: new Date(),
          score,
        },
      });
    }

    return {
      success: true,
      totalQuestions: session.publicQuestions.length,
      correctAnswersCount: session.score,
      detailedResults,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get results",
    };
  }
}
