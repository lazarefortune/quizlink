import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { QuizCreationSuccessContent } from "./quiz-creation-success-content";

type PageProps = {
  params: Promise<{ quizId: string }>;
};

export default async function QuizCreationSuccessPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      name: true,
      ownerId: true,
      status: true,
      _count: { select: { questions: true } },
    },
  });

  if (!quiz || quiz.ownerId !== session.user.id) {
    redirect("/dashboard/quizzes");
  }

  return (
    <QuizCreationSuccessContent
      quizId={quiz.id}
      quizName={quiz.name}
      questionCount={quiz._count.questions}
      quizStatus={quiz.status}
    />
  );
}
