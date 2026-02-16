import { Suspense } from "react";
import { QuizDetailContent } from "./quiz-detail-content";
import { getQuizContent, getQuizStats } from "./actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ quizId: string }>;
};

export default async function QuizStatsPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { ownerId: true, name: true },
  });

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Quiz non trouvé</h1>
          <p className="text-muted-foreground">Ce quiz n'existe pas.</p>
        </div>
      </div>
    );
  }

  if (quiz.ownerId !== session.user.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Accès non autorisé</h1>
          <p className="text-muted-foreground">
            Vous n'avez pas accès à ce quiz.
          </p>
        </div>
      </div>
    );
  }

  const [contentResult, statsResult] = await Promise.all([
    getQuizContent(quizId),
    getQuizStats(quizId),
  ]);

  if (!contentResult.success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Erreur</h1>
          <p className="text-muted-foreground">{contentResult.error}</p>
        </div>
      </div>
    );
  }

  if (!statsResult.success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Erreur</h1>
          <p className="text-muted-foreground">{statsResult.error}</p>
        </div>
      </div>
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
      <QuizDetailContent
        quizId={quizId}
        quizName={contentResult.quiz.name}
        visibility={contentResult.quiz.visibility}
        questions={contentResult.quiz.questions}
        stats={statsResult.stats}
      />
    </Suspense>
  );
}
