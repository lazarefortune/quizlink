import { Suspense } from "react";
import { QuizDetailContent } from "./quiz-detail-content";
import { getQuizContent, getQuizQuestionInsights, getQuizStats } from "./actions";
import { resolveEffectiveQuizSettings } from "@/lib/quiz/resolveEffectiveQuizSettings";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserCoinBalance } from "@/lib/coins";
import { prisma } from "@/lib/prisma";

/** Anonymous stats update via server actions; avoid serving a stale RSC snapshot. */
export const dynamic = "force-dynamic";

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
          <p className="text-muted-foreground">Ce quiz n&apos;existe pas.</p>
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
            Vous n&apos;avez pas accès à ce quiz.
          </p>
        </div>
      </div>
    );
  }

  const [contentResult, statsResult, coinBalance] = await Promise.all([
    getQuizContent(quizId),
    getQuizStats(quizId),
    getUserCoinBalance(session.user.id),
  ]);

  const isResultsUnlocked =
    statsResult.success && (statsResult.stats.quotaStatus?.isUnlocked ?? false);

  const questionInsightsResult =
    contentResult.success && contentResult.quiz.status === "ACTIVE" && isResultsUnlocked
      ? await getQuizQuestionInsights(quizId)
      : { success: true as const, insights: [] };

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
        quizStatus={contentResult.quiz.status}
        questions={contentResult.quiz.questions}
        stats={statsResult.stats}
        questionInsights={
          questionInsightsResult.success ? questionInsightsResult.insights : []
        }
        participantIdentityMode={resolveEffectiveQuizSettings(
          statsResult.stats.quizDetails.settings,
        ).participantIdentityMode}
        hasExistingResponses={statsResult.stats.totalAttemptCount > 0}
        coinBalance={coinBalance}
        isProAvailable={Boolean(process.env.STRIPE_PRO_PRICE_ID)}
      />
    </Suspense>
  );
}
