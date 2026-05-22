import { Suspense } from "react";

import { getAnonymousQuizPlayData } from "@/app/quiz-link/anonymous-quiz-actions";
import { getQuizLinkByToken } from "@/app/quiz-link/actions";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { prisma } from "@/lib/prisma";
import { playBlockedErrorCodeForQuizStatus } from "@/lib/quiz/quizActionErrorCodes";
import { resolveQuizActionError } from "@/lib/quiz/resolveQuizActionError";
import {
  getAnonymousQuizAttemptCookie,
  setAnonymousQuizAttemptCookie,
} from "@/lib/quiz/quiz-attempt-cookie-server";
import { validateAnonymousPlayAttempt } from "@/lib/quiz/validate-anonymous-play-attempt";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

import { AnonymousQuizPlayContent } from "./anonymous-quiz-play-content";
import { QuizPlayContent } from "./quiz-play-content";

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ attemptId?: string; participantId?: string; mode?: string }>;
};

function anonymousAttemptStatusScreen(title: string, description: string) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default async function QuizPlayPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { attemptId: queryAttemptId, participantId, mode } = await searchParams;
  const requestLocale = await getRequestLocale();

  // If participantId is provided, create an attempt automatically
  if (participantId && !queryAttemptId) {
    const { startQuizAttempt } = await import("@/app/quiz-link/actions");
    const quizLinkResult = await getQuizLinkByToken(token);

    if (!quizLinkResult.success || !quizLinkResult.quizLink.participantId) {
      return anonymousAttemptStatusScreen(
        "Lien invalide",
        "Ce lien personnalisé n'est pas valide.",
      );
    }

    if (quizLinkResult.quizLink.participantId !== participantId) {
      return anonymousAttemptStatusScreen(
        "Accès non autorisé",
        "Ce lien ne t'appartient pas.",
      );
    }

    const attemptResult = await startQuizAttempt(
      quizLinkResult.quizLink.id,
      participantId,
    );

    if (!attemptResult.success) {
      return anonymousAttemptStatusScreen(
        "Erreur",
        resolveQuizActionError(requestLocale, attemptResult.error),
      );
    }

    const { redirect } = await import("next/navigation");
    redirect(`/quiz/${token}/play?attemptId=${attemptResult.attempt.id}`);
    return null;
  }

  const quizLinkResult = await getQuizLinkByToken(token);

  if (!quizLinkResult.success) {
    return anonymousAttemptStatusScreen(
      "Quiz non trouvé",
      resolveQuizActionError(requestLocale, quizLinkResult.error),
    );
  }

  const isAnonymousLink =
    mode === "anonymous" || quizLinkResult.quizLink.participantId === null;

  if (isAnonymousLink) {
    const { redirect } = await import("next/navigation");

    if (queryAttemptId) {
      const legacyResolution = await validateAnonymousPlayAttempt(token, queryAttemptId);
      if (legacyResolution.status === "in_progress") {
        await setAnonymousQuizAttemptCookie(token, legacyResolution.attemptId);
        redirect(`/quiz/${token}/play`);
      }
      if (legacyResolution.status === "token_mismatch") {
        return anonymousAttemptStatusScreen(
          "Accès non autorisé",
          "Cette tentative n'appartient pas à ce quiz.",
        );
      }
      if (legacyResolution.status === "blocked") {
        return anonymousAttemptStatusScreen(
          "Accès impossible",
          resolveQuizActionError(requestLocale, legacyResolution.errorCode),
        );
      }
      if (legacyResolution.status === "completed") {
        return anonymousAttemptStatusScreen(
          "Quiz terminé",
          "Vous avez déjà terminé ce quiz.",
        );
      }
      if (legacyResolution.status === "abandoned") {
        return anonymousAttemptStatusScreen(
          "Tentative abandonnée",
          "Cette tentative a été abandonnée et ne peut plus être reprise.",
        );
      }
    }

    const cookieAttemptId = await getAnonymousQuizAttemptCookie(token);

    if (!cookieAttemptId) {
      redirect(`/quiz/${token}`);
    }

    const resolution = await validateAnonymousPlayAttempt(token, cookieAttemptId);

    if (resolution.status === "invalid_id" || resolution.status === "not_found") {
      redirect(`/quiz/${token}`);
    }

    if (resolution.status === "token_mismatch") {
      return anonymousAttemptStatusScreen(
        "Accès non autorisé",
        "Cette tentative n'appartient pas à ce quiz.",
      );
    }

    if (resolution.status === "blocked") {
      return anonymousAttemptStatusScreen(
        "Accès impossible",
        resolveQuizActionError(requestLocale, resolution.errorCode),
      );
    }

    if (resolution.status === "completed") {
      return anonymousAttemptStatusScreen(
        "Quiz terminé",
        "Vous avez déjà terminé ce quiz.",
      );
    }

    if (resolution.status === "abandoned") {
      return anonymousAttemptStatusScreen(
        "Tentative abandonnée",
        "Cette tentative a été abandonnée et ne peut plus être reprise.",
      );
    }

    if (resolution.status === "in_progress") {
      const playAttemptId = resolution.attemptId;

      const anonymousData = await getAnonymousQuizPlayData(token);
      if (!anonymousData.success) {
        return anonymousAttemptStatusScreen(
          "Accès impossible",
          resolveQuizActionError(requestLocale, anonymousData.error),
        );
      }

      return (
        <Suspense
          fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
              Chargement...
            </div>
          }
        >
          <AnonymousQuizPlayContent
            token={token}
            attemptId={playAttemptId}
            quizId={anonymousData.data.quizId}
            quizName={anonymousData.data.quizName}
            settings={anonymousData.data.settings}
            allowMultipleAttempts={anonymousData.data.allowMultipleAttempts}
            questions={anonymousData.data.questions}
          />
        </Suspense>
      );
    }

    redirect(`/quiz/${token}`);
  }

  const attemptId = queryAttemptId;

  if (!attemptId) {
    return anonymousAttemptStatusScreen(
      "Tentative non trouvée",
      "L'identifiant de tentative est manquant.",
    );
  }

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
    return anonymousAttemptStatusScreen(
      "Tentative non trouvée",
      "Cette tentative n'existe pas ou a été supprimée.",
    );
  }

  if (attempt.quizLink.token !== token) {
    return anonymousAttemptStatusScreen(
      "Accès non autorisé",
      "Cette tentative n'appartient pas à ce quiz.",
    );
  }

  const resumeBlocked = playBlockedErrorCodeForQuizStatus(
    attempt.quizLink.quiz.status as QuizLifecycleStatus,
  );
  if (resumeBlocked) {
    return anonymousAttemptStatusScreen(
      "Accès impossible",
      resolveQuizActionError(requestLocale, resumeBlocked),
    );
  }

  if (attempt.status === "COMPLETED") {
    return anonymousAttemptStatusScreen(
      "Quiz terminé",
      "Vous avez déjà terminé ce quiz.",
    );
  }

  if (attempt.status === "ABANDONED") {
    return anonymousAttemptStatusScreen(
      "Tentative abandonnée",
      "Cette tentative a été abandonnée et ne peut plus être reprise.",
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          Chargement...
        </div>
      }
    >
      <QuizPlayContent
        attempt={attempt as import("./quiz-play-content").Attempt}
        token={token}
      />
    </Suspense>
  );
}
