import { Suspense } from "react";
import { QuizResultsContent } from "../quiz-results-content";
import { prisma } from "@/lib/prisma";
import { resolveEffectiveQuizSettings } from "@/lib/quiz/resolveEffectiveQuizSettings";

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

  // Avoid transmitting which option is correct (and the explanation text) to the
  // client when the quiz hides per-question details on the recap page.
  type OptionWithCorrect = { isCorrect: boolean };
  type QuestionWithOptions = { explanation: string | null; options: OptionWithCorrect[] };
  if (attempt) {
    const { showAnswersAtEnd } = resolveEffectiveQuizSettings(
      attempt.quizLink.quiz.settings,
    );
    if (!showAnswersAtEnd) {
      for (const question of attempt.quizLink.quiz.questions as QuestionWithOptions[]) {
        question.explanation = null;
        for (const option of question.options) {
          option.isCorrect = false;
        }
      }
      for (const answer of attempt.answers as { question: QuestionWithOptions }[]) {
        answer.question.explanation = null;
        for (const option of answer.question.options) {
          option.isCorrect = false;
        }
      }
    }
  }

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
