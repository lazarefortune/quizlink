import { Suspense } from "react";
import { QuizResultsContent } from "../quiz-results-content";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ token: string; attemptId: string }>;
};

export default async function QuizResultsPage({ params }: PageProps) {
  const { token, attemptId } = await params;

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quizLink: {
        select: {
          token: true,
          allowMultipleAttempts: true,
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
      answers: {
        include: {
          question: {
            include: {
              options: true,
            },
          },
        },
        orderBy: {
          answeredAt: "asc",
        },
      },
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

  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>}>
      <QuizResultsContent attempt={attempt as import("../quiz-results-content").Attempt} />
    </Suspense>
  );
}
