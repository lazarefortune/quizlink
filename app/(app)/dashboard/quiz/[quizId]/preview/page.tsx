import { Suspense } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { getQuizContent } from "../actions";
import { QuizPreviewContent } from "./quiz-preview-content";

type PageProps = {
  params: Promise<{ quizId: string }>;
};

export default async function QuizPreviewPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { ownerId: true },
  });

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Quiz non trouve</h1>
          <p className="text-muted-foreground">Ce quiz n&apos;existe pas.</p>
        </div>
      </div>
    );
  }

  if (quiz.ownerId !== session.user.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Acces non autorise</h1>
          <p className="text-muted-foreground">
            Vous n&apos;avez pas acces a ce quiz.
          </p>
        </div>
      </div>
    );
  }

  const contentResult = await getQuizContent(quizId);
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

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          Chargement...
        </div>
      }
    >
      <QuizPreviewContent
        quizId={quizId}
        quizName={contentResult.quiz.name}
        questions={contentResult.quiz.questions}
      />
    </Suspense>
  );
}
