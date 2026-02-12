import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ParticipantReportContent } from "./report-content";

type PageProps = {
  params: Promise<{ quizId: string; participantId: string }>;
};

export default async function QuizParticipantReportPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { quizId, participantId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, name: true, ownerId: true, _count: { select: { questions: true } } },
  });
  if (!quiz || quiz.ownerId !== session.user.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Accès non autorisé</h1>
          <p className="text-muted-foreground">Quiz introuvable ou tu n'as pas accès.</p>
        </div>
      </div>
    );
  }

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { id: true, name: true, email: true },
  });
  if (!participant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Participant introuvable</h1>
          <p className="text-muted-foreground">Ce participant n'existe pas.</p>
        </div>
      </div>
    );
  }

  const link = await prisma.quizLink.findFirst({
    where: { quizId, participantId },
    include: { _count: { select: { attempts: true } } },
  });
  if (!link || link._count.attempts === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Aucune tentative</h1>
          <p className="text-muted-foreground">
            Ce participant n'a pas encore de tentative pour ce quiz. Le rapport IA est disponible après au moins une tentative.
          </p>
        </div>
      </div>
    );
  }

  const attemptsCount = link._count.attempts;
  const coinBalance = session.user.coinBalance ?? 0;
  const isAdmin = session.user.role === "ADMIN";
  const canGenerate = isAdmin || coinBalance >= 4;

  return (
    <ParticipantReportContent
      quizId={quizId}
      quizName={quiz.name}
      questionsCount={quiz._count.questions}
      participantId={participantId}
      participantName={participant.name}
      participantEmail={participant.email ?? undefined}
      attemptsCount={attemptsCount}
      coinBalance={coinBalance}
      canGenerate={canGenerate}
      isAdmin={isAdmin}
      backHref={`/dashboard/participants/${participantId}`}
    />
  );
}
