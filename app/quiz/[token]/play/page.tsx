import { Suspense } from "react";

import { getAnonymousQuizPlayData } from "@/app/quiz-link/anonymous-quiz-actions";
import { getQuizLinkByToken } from "@/app/quiz-link/actions";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { prisma } from "@/lib/prisma";
import { playBlockedErrorCodeForQuizStatus } from "@/lib/quiz/quizActionErrorCodes";
import { resolveQuizActionError } from "@/lib/quiz/resolveQuizActionError";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

import { AnonymousQuizPlayContent } from "./anonymous-quiz-play-content";
import { QuizPlayContent } from "./quiz-play-content";

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ attemptId?: string; participantId?: string; mode?: string }>;
};

export default async function QuizPlayPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { attemptId, participantId, mode } = await searchParams;
  const requestLocale = await getRequestLocale();

  // If participantId is provided, create an attempt automatically
  if (participantId && !attemptId) {
    const { startQuizAttempt } = await import("@/app/quiz-link/actions");
    const quizLinkResult = await getQuizLinkByToken(token);

    if (!quizLinkResult.success || !quizLinkResult.quizLink.participantId) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-bold mb-4">Lien invalide</h1>
            <p className="text-muted-foreground">
              Ce lien personnalisé n&apos;est pas valide.
            </p>
          </div>
        </div>
      );
    }

    if (quizLinkResult.quizLink.participantId !== participantId) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-bold mb-4">Accès non autorisé</h1>
            <p className="text-muted-foreground">
              Ce lien ne t&apos;appartient pas.
            </p>
          </div>
        </div>
      );
    }

    const attemptResult = await startQuizAttempt(quizLinkResult.quizLink.id, participantId);

    if (!attemptResult.success) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-bold mb-4">Erreur</h1>
            <p className="text-muted-foreground">
              {resolveQuizActionError(requestLocale, attemptResult.error)}
            </p>
          </div>
        </div>
      );
    }

    // Redirect with attemptId
    const { redirect } = await import("next/navigation");
    redirect(`/quiz/${token}/play?attemptId=${attemptResult.attempt.id}`);
    return null;
  }

  if (!attemptId) {
    const quizLinkResult = await getQuizLinkByToken(token);

    if (!quizLinkResult.success) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-bold mb-4">Quiz non trouvé</h1>
            <p className="text-muted-foreground">
              {resolveQuizActionError(requestLocale, quizLinkResult.error)}
            </p>
          </div>
        </div>
      );
    }

    const useAnonymousFlow =
      mode === "anonymous" || quizLinkResult.quizLink.participantId === null;

    if (useAnonymousFlow) {
      const { redirect } = await import("next/navigation");
      redirect(`/quiz/${token}`);
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Tentative non trouvée</h1>
          <p className="text-muted-foreground">
            L&apos;identifiant de tentative est manquant.
          </p>
        </div>
      </div>
    );
  }

  // Verify attempt exists and belongs to this token
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quizLink: {
        include: {
          quiz: {
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
          },
        },
      },
      participant: true,
    },
  });

  if (!attempt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Tentative non trouvée</h1>
          <p className="text-muted-foreground">
            Cette tentative n&apos;existe pas ou a été supprimée.
          </p>
        </div>
      </div>
    );
  }

  if (attempt.quizLink.token !== token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Accès non autorisé</h1>
          <p className="text-muted-foreground">
            Cette tentative n&apos;appartient pas à ce quiz.
          </p>
        </div>
      </div>
    );
  }

  const resumeBlocked = playBlockedErrorCodeForQuizStatus(
    attempt.quizLink.quiz.status as QuizLifecycleStatus,
  );
  if (resumeBlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Accès impossible</h1>
          <p className="text-muted-foreground">
            {resolveQuizActionError(requestLocale, resumeBlocked)}
          </p>
        </div>
      </div>
    );
  }

  if (attempt.status === "COMPLETED") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Quiz terminé</h1>
          <p className="text-muted-foreground">
            Vous avez déjà terminé ce quiz.
          </p>
        </div>
      </div>
    );
  }

  if (attempt.status === "ABANDONED") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Tentative abandonnée</h1>
          <p className="text-muted-foreground">
            Cette tentative a été abandonnée et ne peut plus être reprise.
          </p>
        </div>
      </div>
    );
  }

  const isAnonymousAttempt = attempt.quizLink.participantId === null;

  if (isAnonymousAttempt) {
    const anonymousData = await getAnonymousQuizPlayData(token);
    if (!anonymousData.success) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-bold mb-4">Accès impossible</h1>
            <p className="text-muted-foreground">
              {resolveQuizActionError(requestLocale, anonymousData.error)}
            </p>
          </div>
        </div>
      );
    }

    return (
      <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>}>
        <AnonymousQuizPlayContent
          token={token}
          attemptId={attemptId}
          quizId={anonymousData.data.quizId}
          quizName={anonymousData.data.quizName}
          settings={anonymousData.data.settings}
          allowMultipleAttempts={anonymousData.data.allowMultipleAttempts}
          questions={anonymousData.data.questions}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>}>
      <QuizPlayContent
        attempt={attempt as import("./quiz-play-content").Attempt}
        token={token}
      />
    </Suspense>
  );
}
