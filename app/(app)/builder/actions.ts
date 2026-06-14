"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";

import { auth } from "@/lib/auth";
import { creatorCountedAttemptWhere } from "@/lib/creator-quiz-attempt-filter";
import { batchResolveQuizCompletedCounts } from "@/lib/quiz/batchResolveQuizCompletedCounts";
import { batchResolveQuizQuotaStatusForOwner } from "@/lib/quiz/batchResolveQuizQuotaStatusForOwner";
import {
  serializeQuizResponseQuotaStatus,
  type SerializedQuizResponseQuotaStatus,
} from "@/lib/quiz/quizResponseQuotaStatus";
import { FINALIZE_DRAFT_QUIZ_ERROR_CODE } from "@/lib/builder/finalizeDraftQuizErrors";
import {
  SAVE_MODIFIED_QUIZ_AS_DRAFT_COPY_ERROR,
  type SaveModifiedQuizAsDraftCopyResult,
} from "@/lib/builder/saveModifiedQuizAsDraftCopy";
import { buildPlayableContentMultisetKey } from "@/lib/builder/quizContentChangeDetection";
import { mergeBuilderSaveValidationErrors } from "@/lib/builder/serverAutosaveGate";
import { prisma } from "@/lib/prisma";
import { t, type Locale } from "@/lib/i18n";
import { sanitizeQuizRichText } from "@/lib/rich-text/sanitizeQuizRichText";
import {
  copyQuestionImageStorageObject,
  deleteQuestionImage,
  isSafeQuestionImageStorageKey,
} from "@/lib/storage/question-image-storage";
import { deriveTimeLimitUiFromSettings } from "@/lib/time-limit-seconds";
import type { QuestionType, QuizBuilder } from "@/types/quiz-builder";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

import { getUserQuizCreationVisibility } from "./user-quiz-visibility";

function normalizeBuilderActionLocale(locale: unknown): Locale {
  return locale === "en" ? "en" : "fr";
}

export type SaveQuizOptions = {
  resetRecordedResponsesBeforeUpdate?: boolean;
};

export async function getActiveQuizSaveStatsWarning(quizId: string): Promise<
  | { success: true; needsWarning: boolean }
  | { success: false; error: string }
> {
  try {
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { ownerId: true, status: true },
    });

    if (!quiz || quiz.ownerId !== session.user.id) {
      return { success: false, error: "Quiz not found" };
    }

    if (quiz.status !== "ACTIVE") {
      return { success: true, needsWarning: false };
    }

    const [answerCount, anonymousRows] = await Promise.all([
      prisma.quizAnswer.count({
        where: { question: { quizId } },
      }),
      prisma.quizLinkAnonymousStats.findMany({
        where: { quizLink: { quizId } },
        select: { startedCount: true, completedCount: true },
      }),
    ]);

    const hasAnonymousEngagement = anonymousRows.some(
      (row) => row.startedCount > 0 || row.completedCount > 0,
    );

    return {
      success: true,
      needsWarning: answerCount > 0 || hasAnonymousEngagement,
    };
  } catch (error) {
    console.error("getActiveQuizSaveStatsWarning:", error);
    return { success: false, error: "Failed to read quiz activity" };
  }
}

/**
 * Persists the current builder state as a new DRAFT quiz without modifying the original ACTIVE quiz
 * (responses and statistics on the original are left untouched).
 */
export async function saveModifiedQuizAsDraftCopyAction(
  originalQuizId: string,
  quizBuilder: QuizBuilder,
  localeInput: unknown = "fr",
): Promise<SaveModifiedQuizAsDraftCopyResult> {
  try {
    if (!prisma) {
      return {
        success: false,
        error: "Database not initialized. Please run 'pnpm prisma:generate' first.",
      };
    }

    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: SAVE_MODIFIED_QUIZ_AS_DRAFT_COPY_ERROR.UNAUTHORIZED };
    }

    const originalQuiz = await prisma.quiz.findUnique({
      where: { id: originalQuizId },
      select: { ownerId: true, status: true },
    });

    if (!originalQuiz) {
      return { success: false, error: SAVE_MODIFIED_QUIZ_AS_DRAFT_COPY_ERROR.QUIZ_NOT_FOUND };
    }

    if (originalQuiz.ownerId !== userId) {
      return { success: false, error: SAVE_MODIFIED_QUIZ_AS_DRAFT_COPY_ERROR.UNAUTHORIZED };
    }

    if (originalQuiz.status !== "ACTIVE") {
      return { success: false, error: SAVE_MODIFIED_QUIZ_AS_DRAFT_COPY_ERROR.UNAUTHORIZED };
    }

    if (quizBuilder.questions.length === 0) {
      return { success: false, error: SAVE_MODIFIED_QUIZ_AS_DRAFT_COPY_ERROR.VALIDATION_FAILED };
    }

    const locale = normalizeBuilderActionLocale(localeInput);
    const timeLimitUi = deriveTimeLimitUiFromSettings(quizBuilder.settings);
    const validationErrors = mergeBuilderSaveValidationErrors(quizBuilder, timeLimitUi);
    if (validationErrors.length > 0) {
      return { success: false, error: SAVE_MODIFIED_QUIZ_AS_DRAFT_COPY_ERROR.VALIDATION_FAILED };
    }

    for (const q of quizBuilder.questions) {
      if (q.imageKey && !isSafeQuestionImageStorageKey(q.imageKey)) {
        return { success: false, error: SAVE_MODIFIED_QUIZ_AS_DRAFT_COPY_ERROR.INVALID_IMAGE_KEY };
      }
    }

    const writtenStorageKeys: string[] = [];
    let newQuizId: string | null = null;

    const copyName = `${quizBuilder.name.trim()}${t(locale, "builder.quizDraftCopyNameSuffix")}`;

    try {
      const createdQuiz = await prisma.quiz.create({
        data: {
          ownerId: userId,
          name: copyName,
          visibility: "PRIVATE",
          status: "DRAFT",
          publishedAt: null,
          settings: quizBuilder.settings as Prisma.InputJsonValue,
          questions: {
            create: quizBuilder.questions.map((q, index) => ({
              type: q.type,
              label: sanitizeQuizRichText(q.label),
              image: q.imageKey ? null : (q.image || null),
              imageKey: null,
              explanation: q.explanation?.trim() || null,
              order: index,
              options: {
                create: q.options.map((opt) => ({
                  label: opt.label,
                  isCorrect: opt.isCorrect,
                })),
              },
            })),
          },
        },
        include: {
          questions: {
            orderBy: { order: "asc" },
            select: { id: true },
          },
        },
      });

      newQuizId = createdQuiz.id;

      for (let i = 0; i < quizBuilder.questions.length; i += 1) {
        const sourceQuestion = quizBuilder.questions[i];
        const newQuestion = createdQuiz.questions[i];
        if (!sourceQuestion?.imageKey || !newQuestion) {
          continue;
        }
        const newKey = await copyQuestionImageStorageObject({
          sourceKey: sourceQuestion.imageKey,
          targetUserId: userId,
          targetQuizId: createdQuiz.id,
        });
        writtenStorageKeys.push(newKey);
        await prisma.question.update({
          where: { id: newQuestion.id },
          data: { imageKey: newKey },
        });
      }

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/quizzes");
      revalidatePath(`/builder/${createdQuiz.id}`);

      return { success: true, quizId: createdQuiz.id };
    } catch (innerError) {
      if (newQuizId !== null) {
        await prisma.quiz.delete({ where: { id: newQuizId } }).catch(() => {
          // best-effort cleanup
        });
      }
      for (const key of writtenStorageKeys) {
        await deleteQuestionImage(key).catch(() => {
          // best-effort cleanup of copied blobs only
        });
      }
      console.error("saveModifiedQuizAsDraftCopyAction:", innerError);
      return { success: false, error: SAVE_MODIFIED_QUIZ_AS_DRAFT_COPY_ERROR.SAVE_FAILED };
    }
  } catch (error) {
    console.error("saveModifiedQuizAsDraftCopyAction:", error);
    return { success: false, error: SAVE_MODIFIED_QUIZ_AS_DRAFT_COPY_ERROR.SAVE_FAILED };
  }
}

export async function saveQuiz(
  quiz: QuizBuilder,
  quizId?: string,
  options?: SaveQuizOptions,
) {
  try {
    if (!prisma) {
      return {
        success: false,
        error: "Database not initialized. Please run 'pnpm prisma:generate' first.",
      };
    }

    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to save a quiz",
      };
    }

    // If quizId is provided, update existing quiz
    if (quizId) {
      const existingQuiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        select: { ownerId: true, status: true },
      });

      if (!existingQuiz || existingQuiz.ownerId !== session.user.id) {
        return {
          success: false,
          error: "You don't have permission to update this quiz",
        };
      }

      if (options?.resetRecordedResponsesBeforeUpdate) {
        if (existingQuiz.status !== "ACTIVE") {
          return {
            success: false,
            error: "Invalid save request",
          };
        }
      } else {
        const answersOnQuiz = await prisma.quizAnswer.count({
          where: { question: { quizId } },
        });
        if (answersOnQuiz > 0) {
          const persistedQuiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            include: {
              questions: {
                include: { options: true },
                orderBy: { order: "asc" },
              },
            },
          });
          if (!persistedQuiz) {
            return {
              success: false,
              error: "You don't have permission to update this quiz",
            };
          }

          const persistedComparable: Pick<QuizBuilder, "questions"> = {
            questions: persistedQuiz.questions.map((q) => ({
              id: q.id,
              type: q.type as QuestionType,
              label: q.label,
              image: q.image ?? undefined,
              imageKey: q.imageKey ?? undefined,
              explanation: q.explanation ?? undefined,
              options: q.options.map((o) => ({
                id: o.id,
                label: o.label,
                isCorrect: o.isCorrect,
              })),
            })),
          };

          if (
            buildPlayableContentMultisetKey(persistedComparable) !==
            buildPlayableContentMultisetKey(quiz)
          ) {
            return {
              success: false,
              error:
                "Ce quiz a des réponses enregistrées. Dupliquez le quiz pour le modifier sans perdre les statistiques.",
            };
          }

          await prisma.quiz.update({
            where: { id: quizId },
            data: {
              name: quiz.name,
              visibility: quiz.visibility,
              settings: quiz.settings as Prisma.InputJsonValue,
            },
          });

          revalidatePath("/dashboard");
          revalidatePath(`/builder/${quizId}`);

          return {
            success: true,
            quizId,
          };
        }
      }

      await prisma.$transaction(async (tx) => {
        if (options?.resetRecordedResponsesBeforeUpdate) {
          const linkIds = (
            await tx.quizLink.findMany({
              where: { quizId },
              select: { id: true },
            })
          ).map((row) => row.id);

          if (linkIds.length > 0) {
            const attemptIds = (
              await tx.quizAttempt.findMany({
                where: { quizLinkId: { in: linkIds } },
                select: { id: true },
              })
            ).map((a) => a.id);

            if (attemptIds.length > 0) {
              await tx.quizAnswer.deleteMany({
                where: { attemptId: { in: attemptIds } },
              });
            }

            await tx.quizAttempt.deleteMany({
              where: { quizLinkId: { in: linkIds } },
            });

            await tx.quizLinkAnonymousStats.deleteMany({
              where: { quizLinkId: { in: linkIds } },
            });
          }
        }

        const remainingAnswers = await tx.quizAnswer.count({
          where: { question: { quizId } },
        });
        if (remainingAnswers > 0) {
          throw new Error("QUIZ_SAVE_BLOCKED_BY_ANSWERS");
        }

        await tx.option.deleteMany({
          where: {
            question: {
              quizId,
            },
          },
        });

        await tx.question.deleteMany({
          where: { quizId },
        });

        await tx.quiz.update({
          where: { id: quizId },
          data: {
            name: quiz.name,
            visibility: quiz.visibility,
            settings: quiz.settings as Prisma.InputJsonValue,
            questions: {
              create: quiz.questions.map((q, index) => ({
                type: q.type,
                label: sanitizeQuizRichText(q.label),
                image: q.imageKey ? null : (q.image || null),
                imageKey: q.imageKey || null,
                explanation: q.explanation?.trim() || null,
                order: index,
                options: {
                  create: q.options.map((opt) => ({
                    label: opt.label,
                    isCorrect: opt.isCorrect,
                  })),
                },
              })),
            },
          },
        });
      });

      revalidatePath("/dashboard");
      revalidatePath(`/builder/${quizId}`);

      return {
        success: true,
        quizId,
      };
    }

    // Create new quiz
    const savedQuiz = await prisma.quiz.create({
      data: {
        ownerId: session.user.id,
        name: quiz.name,
        visibility: getUserQuizCreationVisibility(),
        settings: quiz.settings as Prisma.InputJsonValue,
        questions: {
          create: quiz.questions.map((q, index) => ({
            type: q.type,
            label: sanitizeQuizRichText(q.label),
            image: q.imageKey ? null : (q.image || null),
            imageKey: q.imageKey || null,
            explanation: q.explanation?.trim() || null,
            order: index,
            options: {
              create: q.options.map((opt) => ({
                label: opt.label,
                isCorrect: opt.isCorrect,
              })),
            },
          })),
        },
      },
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

    revalidatePath("/dashboard");
    revalidatePath(`/builder/${savedQuiz.id}`);

    return {
      success: true,
      quizId: savedQuiz.id,
    };
  } catch (error) {
    console.error("Error saving quiz:", error);
    if (error instanceof Error && error.message === "QUIZ_SAVE_BLOCKED_BY_ANSWERS") {
      return {
        success: false,
        error:
          "Ce quiz a des réponses enregistrées. Dupliquez le quiz pour le modifier sans perdre les statistiques.",
      };
    }
    return {
      success: false,
      error: "Failed to save quiz",
    };
  }
}

export async function getUserQuizzes() {
  try {
    if (!prisma) {
      return {
        success: false,
        error: "Database not initialized. Please run 'pnpm prisma:generate' first.",
        quizzes: [],
      };
    }

    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in",
        quizzes: [],
      };
    }

    const quizzes = await prisma.quiz.findMany({
      where: {
        ownerId: session.user.id,
      },
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
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Get all quiz links and attempts separately
    const quizIds = quizzes.map((q) => q.id);
    const quizLinks = await prisma.quizLink.findMany({
      where: {
        quizId: { in: quizIds },
      },
      include: {
        attempts: {
          where: { ...creatorCountedAttemptWhere },
          select: {
            id: true,
            startedAt: true,
            finishedAt: true,
            score: true,
            status: true,
            participant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            startedAt: "desc",
          },
        },
      },
    });

    // Group attempts by quizId
    type RawAttempt = {
      id: string;
      startedAt: Date;
      finishedAt: Date | null;
      score: number | null;
      status: string;
      participant: { id: string; name: string } | null;
    };

    const attemptsByQuizId = new Map<
      string,
      Array<{
        id: string;
        participantName: string;
        startedAt: Date;
        finishedAt: Date | null;
        score: number | null;
        status: string;
      }>
    >();

    for (const link of quizLinks) {
      if (!attemptsByQuizId.has(link.quizId)) {
        attemptsByQuizId.set(link.quizId, []);
      }
      const attempts = link.attempts.map((attempt: RawAttempt) => ({
        id: attempt.id,
        participantName: attempt.participant?.name || "Unknown",
        startedAt: attempt.startedAt,
        finishedAt: attempt.finishedAt,
        score: attempt.score,
        status: attempt.status,
      }));
      attemptsByQuizId.get(link.quizId)!.push(...attempts);
    }

    return {
      success: true,
      quizzes: quizzes.map((quiz) => ({
        id: quiz.id,
        name: quiz.name,
        visibility: quiz.visibility as "PRIVATE" | "PUBLIC",
        status: quiz.status,
        publishedAt:
          quiz.publishedAt instanceof Date
            ? quiz.publishedAt.toISOString()
            : quiz.publishedAt
              ? new Date(quiz.publishedAt).toISOString()
              : null,
        settings: quiz.settings as unknown,
        questions: quiz.questions.map((q) => ({
          id: q.id,
          type: q.type as "MULTIPLE_CHOICE" | "CHECKBOX" | "TRUE_FALSE",
          label: q.label,
          image: q.image || undefined,
          imageKey: q.imageKey || undefined,
          options: q.options.map((opt) => ({
            id: opt.id,
            label: opt.label,
            isCorrect: opt.isCorrect,
          })),
        })),
        attempts: attemptsByQuizId.get(quiz.id) || [],
        createdAt: quiz.createdAt instanceof Date
          ? quiz.createdAt.toISOString()
          : new Date(quiz.createdAt).toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch quizzes",
      quizzes: [],
    };
  }
}

export type UserQuizListItem = {
  id: string;
  name: string;
  visibility: "PRIVATE" | "PUBLIC";
  status: QuizLifecycleStatus;
  publishedAt: string | null;
  questionCount: number;
  attemptCount: number;
  createdAt: string;
  quotaStatus?: SerializedQuizResponseQuotaStatus;
};

const DEFAULT_PAGE_SIZE = 12;

export async function getUserQuizzesPaginated(
  page: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
  search?: string,
): Promise<{
  success: boolean;
  quizzes: UserQuizListItem[];
  total: number;
  error?: string;
}> {
  try {
    if (!prisma) {
      return {
        success: false,
        quizzes: [],
        total: 0,
        error: "Database not initialized. Please run 'pnpm prisma:generate' first.",
      };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        quizzes: [],
        total: 0,
        error: "You must be logged in",
      };
    }

    const where = {
      ownerId: session.user.id,
      ...(search?.trim()
        ? { name: { contains: search.trim() } }
        : {}),
    };

    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        select: {
          id: true,
          name: true,
          visibility: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          _count: { select: { questions: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.quiz.count({ where }),
    ]);

    const quizIds = quizzes.map((q) => q.id);
    const [responseCountByQuizId, quotaStatusByQuizId] = await Promise.all([
      batchResolveQuizCompletedCounts(quizIds),
      batchResolveQuizQuotaStatusForOwner(session.user.id, quizIds),
    ]);

    return {
      success: true,
      quizzes: quizzes.map((q) => {
        const attemptCount = responseCountByQuizId.get(q.id) ?? 0;
        const quotaStatus = quotaStatusByQuizId.get(q.id);
        return {
          id: q.id,
          name: q.name,
          visibility: q.visibility as "PRIVATE" | "PUBLIC",
          status: q.status,
          publishedAt:
            q.publishedAt instanceof Date
              ? q.publishedAt.toISOString()
              : q.publishedAt
                ? new Date(q.publishedAt).toISOString()
                : null,
          questionCount: q._count.questions,
          attemptCount,
          createdAt:
            q.createdAt instanceof Date
              ? q.createdAt.toISOString()
              : new Date(q.createdAt).toISOString(),
          quotaStatus:
            q.status === "ACTIVE" && quotaStatus
              ? serializeQuizResponseQuotaStatus(quotaStatus)
              : undefined,
        };
      }),
      total,
    };
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return {
      success: false,
      quizzes: [],
      total: 0,
      error: error instanceof Error ? error.message : "Failed to fetch quizzes",
    };
  }
}

type PrismaQuizWithQuestions = {
  id: string;
  name: string;
  visibility: string;
  settings: unknown;
  createdAt: Date;
  ownerId: string | null;
  status: QuizLifecycleStatus;
  questions: Array<{
    id: string;
    type: string;
    label: string;
    image: string | null;
    imageKey: string | null;
    explanation: string | null;
    options: Array<{ id: string; label: string; isCorrect: boolean }>;
  }>;
};

function mapPrismaQuizToQuizBuilderForFinalize(quiz: PrismaQuizWithQuestions): QuizBuilder {
  return {
    id: quiz.id,
    name: quiz.name,
    visibility: quiz.visibility as "PRIVATE" | "PUBLIC",
    settings: quiz.settings as QuizBuilder["settings"],
    questions: quiz.questions.map((q) => ({
      id: q.id,
      type: q.type as QuestionType,
      label: q.label,
      image: q.image ?? undefined,
      imageKey: q.imageKey ?? undefined,
      explanation: q.explanation ?? undefined,
      options: q.options.map((opt) => ({
        id: opt.id,
        label: opt.label,
        isCorrect: opt.isCorrect,
      })),
    })),
    createdBy: "USER",
    createdAt: quiz.createdAt.toISOString(),
  };
}

export type FinalizeDraftQuizResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Validates persisted quiz content and transitions a DRAFT quiz to ACTIVE with `publishedAt` set.
 * Call after `saveQuiz` so the database reflects the latest builder state.
 */
export async function finalizeDraftQuizAction(quizId: string): Promise<FinalizeDraftQuizResult> {
  try {
    if (!prisma) {
      return { success: false, error: FINALIZE_DRAFT_QUIZ_ERROR_CODE.DATABASE_ERROR };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: FINALIZE_DRAFT_QUIZ_ERROR_CODE.NOT_AUTHENTICATED };
    }

    const userId = session.user.id;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!quiz) {
      return { success: false, error: FINALIZE_DRAFT_QUIZ_ERROR_CODE.QUIZ_NOT_FOUND };
    }

    if (quiz.ownerId !== userId) {
      return { success: false, error: FINALIZE_DRAFT_QUIZ_ERROR_CODE.NOT_OWNER };
    }

    const status = quiz.status as QuizLifecycleStatus;
    if (status === "ARCHIVED") {
      return { success: false, error: FINALIZE_DRAFT_QUIZ_ERROR_CODE.ARCHIVED };
    }
    if (status !== "DRAFT") {
      return { success: false, error: FINALIZE_DRAFT_QUIZ_ERROR_CODE.NOT_DRAFT };
    }

    if (quiz.questions.length === 0) {
      return { success: false, error: FINALIZE_DRAFT_QUIZ_ERROR_CODE.NO_QUESTIONS };
    }

    const quizRow = quiz as PrismaQuizWithQuestions;
    const quizBuilder = mapPrismaQuizToQuizBuilderForFinalize(quizRow);
    const timeLimitUi = deriveTimeLimitUiFromSettings(quizBuilder.settings);
    const validationErrors = mergeBuilderSaveValidationErrors(quizBuilder, timeLimitUi);
    if (validationErrors.length > 0) {
      return { success: false, error: FINALIZE_DRAFT_QUIZ_ERROR_CODE.VALIDATION_FAILED };
    }

    const updateResult = await prisma.quiz.updateMany({
      where: {
        id: quizId,
        ownerId: userId,
        status: "DRAFT",
      },
      data: {
        status: "ACTIVE",
        publishedAt: new Date(),
      },
    });

    if (updateResult.count === 0) {
      return { success: false, error: FINALIZE_DRAFT_QUIZ_ERROR_CODE.NOT_DRAFT };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/quizzes");
    revalidatePath("/dashboard/create");
    revalidatePath(`/dashboard/quiz/${quizId}`);
    revalidatePath(`/dashboard/quiz/${quizId}/success`);
    revalidatePath(`/builder/${quizId}`);

    return { success: true };
  } catch (error) {
    console.error("finalizeDraftQuizAction:", error);
    return { success: false, error: FINALIZE_DRAFT_QUIZ_ERROR_CODE.DATABASE_ERROR };
  }
}
