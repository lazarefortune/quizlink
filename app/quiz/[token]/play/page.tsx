import { Suspense } from "react";
import { QuizPlayContent } from "./quiz-play-content";
import { getQuizLinkByToken } from "@/app/quiz-link/actions";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ attemptId?: string; participantId?: string }>;
};

export default async function QuizPlayPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { attemptId, participantId } = await searchParams;

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
              Ce lien personnalisé n'est pas valide.
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
              Ce lien ne vous appartient pas.
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
            <p className="text-muted-foreground">{attemptResult.error}</p>
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Tentative non trouvée</h1>
          <p className="text-muted-foreground">
            L'identifiant de tentative est manquant.
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
            Cette tentative n'existe pas ou a été supprimée.
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
            Cette tentative n'appartient pas à ce quiz.
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

  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>}>
      <QuizPlayContent
        attempt={attempt}
        token={token}
      />
    </Suspense>
  );
}
